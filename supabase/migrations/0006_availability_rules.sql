-- =====================================================================
-- Disponibilidad por rangos (reglas) sobre el calendario.
--
-- El admin crea rangos horarios sobre un día del calendario. Cada rango es
-- "disponible" o "no disponible" y puede ser único o en serie (el mismo día
-- de la semana durante todo el mes, o desde el mes del día elegido hasta una
-- fecha). Los rangos se guardan en availability_rules.
--
-- availability_windows pasa a ser DERIVADA: por cada día, lo disponible menos
-- lo no disponible, sin los tramos más cortos que la sesión más corta. Solo la
-- recalcula el servidor (rebuild_availability) al guardar o borrar un rango, y
-- nunca si alguna reserva activa quedaría fuera. Sigue siendo lo único que
-- consultan get_availability y create_booking: la parte pública no cambia.
--
-- Sustituye a availability_months / save_month_availability (0003 y la 0006
-- local "availability_days", que nunca llegó a producción): sus franjas futuras
-- se convierten en rangos y se comprueba que el resultado es idéntico.
-- =====================================================================

create type public.availability_kind as enum ('disponible', 'no_disponible');
-- unico: solo ese día · mes: ese día de la semana en todo su mes ·
-- hasta: ese día de la semana desde el día 1 de su mes hasta until_day
create type public.availability_repeat as enum ('unico', 'mes', 'hasta');

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  kind public.availability_kind not null,
  -- Día elegido en el calendario (marca el día de la semana de la serie)
  day date not null,
  -- Hora de Madrid, en pasos de 15 min
  start_time time not null,
  end_time time not null,
  repeat public.availability_repeat not null default 'unico',
  until_day date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (mod(extract(epoch from start_time)::int, 900) = 0 and mod(extract(epoch from end_time)::int, 900) = 0),
  check ((repeat = 'hasta') = (until_day is not null)),
  check (until_day is null or (until_day >= day and until_day <= day + 366))
);

-- ===== Días en los que se aplica un rango =====
create or replace function public.availability_rule_days(p_day date, p_repeat public.availability_repeat, p_until date)
returns setof date language sql immutable set search_path = public as $$
  select d::date
  from generate_series(
         case when p_repeat = 'unico' then p_day else date_trunc('month', p_day)::date end::timestamp,
         case p_repeat
           when 'unico' then p_day
           when 'mes'   then (date_trunc('month', p_day) + interval '1 month' - interval '1 day')::date
           else p_until
         end::timestamp,
         interval '1 day') as d
  where extract(isodow from d) = extract(isodow from p_day)
$$;

-- ===== Disponibilidad de un día: rangos disponibles menos no disponibles =====
create or replace function public.availability_day_ranges(p_day date)
returns tstzmultirange language sql stable set search_path = public as $$
  select coalesce(range_agg(o.rg) filter (where o.kind = 'disponible'), '{}'::tstzmultirange)
       - coalesce(range_agg(o.rg) filter (where o.kind = 'no_disponible'), '{}'::tstzmultirange)
  from (
    select r.kind,
           tstzrange((p_day + r.start_time) at time zone 'Europe/Madrid',
                     (p_day + r.end_time) at time zone 'Europe/Madrid', '[)') as rg
    from availability_rules r
    where p_day in (select availability_rule_days(r.day, r.repeat, r.until_day))
  ) o
$$;

-- ===== Recalcula las franjas de esos días (desde hoy) a partir de los rangos =====
-- Falla con BOOKINGS_OUTSIDE_WINDOWS si alguna reserva activa de esos días se
-- queda sin franja que la cubra entera (mismo criterio que create_booking).
create or replace function public.rebuild_availability(p_days date[]) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  -- Un tramo más corto que la sesión más corta no sirve para reservar
  v_min   interval := make_interval(mins => (select min(duration_min) from packages));
  v_days  date[];
  v_new   tstzrange[];
begin
  select coalesce(array_agg(distinct d), '{}') into v_days
  from unnest(p_days) as d where d >= v_today;
  if cardinality(v_days) = 0 then
    return;
  end if;

  select coalesce(array_agg(x order by lower(x)), '{}') into v_new
  from unnest(v_days) as d, unnest(availability_day_ranges(d)) as x
  where upper(x) - lower(x) >= v_min;

  if exists (
    select 1 from bookings b
    where b.status <> 'rechazada'
      and (b.starts_at at time zone 'Europe/Madrid')::date = any(v_days)
      and not exists (select 1 from unnest(v_new) as w where w @> tstzrange(b.starts_at, b.ends_at, '[)'))
  ) then
    raise exception 'BOOKINGS_OUTSIDE_WINDOWS';
  end if;

  -- Ya se ha comprobado que las reservas quedan cubiertas: se salta el trigger
  perform set_config('app.replacing_windows', 'on', true);
  delete from availability_windows where (starts_at at time zone 'Europe/Madrid')::date = any(v_days);
  perform set_config('app.replacing_windows', 'off', true);

  insert into availability_windows (starts_at, ends_at)
  select lower(x), upper(x) from unnest(v_new) as x;
end $$;

-- ===== RPC de admin: crear o editar un rango =====
-- p_id null → rango nuevo. Al editar se recalculan los días de antes y los de después.
create or replace function public.save_availability_rule(
  p_kind public.availability_kind,
  p_day date,
  p_start time,
  p_end time,
  p_repeat public.availability_repeat,
  p_until date default null,
  p_id uuid default null
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_until date := case when p_repeat = 'hasta' then p_until end;
  v_old   availability_rules%rowtype;
  v_id    uuid;
  v_days  date[];
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if p_kind is null or p_day is null or p_start is null or p_end is null or p_repeat is null then
    raise exception 'INVALID_DATA';
  end if;

  -- Mismo bloqueo que create_booking: nadie reserva mientras cambian las franjas
  perform pg_advisory_xact_lock(hashtext('public.create_booking'));

  if p_id is null then
    if p_day < v_today then
      raise exception 'PAST_DAY';
    end if;
    begin
      insert into availability_rules (kind, day, start_time, end_time, repeat, until_day)
      values (p_kind, p_day, p_start, p_end, p_repeat, v_until)
      returning id into v_id;
    exception
      when check_violation then
        raise exception 'INVALID_DATA';
    end;
    select array_agg(d) into v_days from availability_rule_days(p_day, p_repeat, v_until) as d;
  else
    select * into v_old from availability_rules where id = p_id for update;
    if not found then
      raise exception 'NOT_FOUND';
    end if;
    if p_day <> v_old.day and p_day < v_today then
      raise exception 'PAST_DAY';
    end if;
    begin
      update availability_rules
         set kind = p_kind, day = p_day, start_time = p_start, end_time = p_end,
             repeat = p_repeat, until_day = v_until, updated_at = now()
       where id = p_id;
    exception
      when check_violation then
        raise exception 'INVALID_DATA';
    end;
    v_id := p_id;
    select array_agg(d) into v_days from (
      select availability_rule_days(v_old.day, v_old.repeat, v_old.until_day)
      union
      select availability_rule_days(p_day, p_repeat, v_until)
    ) as s(d);
  end if;

  perform rebuild_availability(v_days);
  return v_id;
end $$;

-- ===== RPC de admin: borrar un rango (único o la serie entera) =====
create or replace function public.delete_availability_rule(p_id uuid) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_old  availability_rules%rowtype;
  v_days date[];
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.create_booking'));

  delete from availability_rules where id = p_id returning * into v_old;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  select array_agg(d) into v_days from availability_rule_days(v_old.day, v_old.repeat, v_old.until_day) as d;
  perform rebuild_availability(v_days);
end $$;

-- ===== Conversión de los datos existentes =====
-- Las franjas futuras son la verdad (es lo que se puede reservar). Por cada mes, un
-- tramo que se repite en TODOS los días de esa semana que quedan del mes se guarda
-- como serie "mes"; el resto, como rangos únicos. Las franjas pasadas no se tocan.
do $$
declare
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_bad   int;
  v_days  date[];
  v_day   date;
begin
  -- Solo se convierten franjas dentro de un día de Madrid y en pasos de 15 min
  select count(*) into v_bad
  from availability_windows w
  where (w.starts_at at time zone 'Europe/Madrid')::date >= v_today
    and ((w.starts_at at time zone 'Europe/Madrid')::date
           <> ((w.ends_at - interval '1 microsecond') at time zone 'Europe/Madrid')::date
         or mod(extract(epoch from w.starts_at)::bigint, 900) <> 0
         or mod(extract(epoch from w.ends_at)::bigint, 900) <> 0);
  if v_bad > 0 then
    raise exception 'Hay % franjas futuras que cruzan la medianoche o no van en pasos de 15 min. Corrígelas antes de migrar.', v_bad;
  end if;

  with w as (
    select (starts_at at time zone 'Europe/Madrid')::date as d,
           (starts_at at time zone 'Europe/Madrid')::time as s,
           case when (ends_at at time zone 'Europe/Madrid')::date > (starts_at at time zone 'Europe/Madrid')::date
                then time '24:00' else (ends_at at time zone 'Europe/Madrid')::time end as e
    from availability_windows
    where (starts_at at time zone 'Europe/Madrid')::date >= v_today
  ),
  g as (
    select date_trunc('month', d)::date as m, extract(isodow from d) as dow, s, e,
           array_agg(d order by d) as days
    from w
    group by 1, 2, 3, 4
  ),
  c as (
    select g.*,
           (select count(*)
            from generate_series(greatest(g.m, v_today)::timestamp,
                                 (g.m + interval '1 month' - interval '1 day')::timestamp,
                                 interval '1 day') as x
            where extract(isodow from x) = g.dow) as expected
    from g
  )
  insert into availability_rules (kind, day, start_time, end_time, repeat)
  select 'disponible'::public.availability_kind, c.days[1], c.s, c.e, 'mes'::public.availability_repeat
  from c where cardinality(c.days) = c.expected and c.expected >= 2
  union all
  select 'disponible'::public.availability_kind, unnest(c.days), c.s, c.e, 'unico'::public.availability_repeat
  from c where not (cardinality(c.days) = c.expected and c.expected >= 2);

  -- Comprobación día a día: los rangos reproducen exactamente las franjas actuales
  select coalesce(array_agg(distinct d), '{}') into v_days from (
    select (starts_at at time zone 'Europe/Madrid')::date as d
    from availability_windows where (starts_at at time zone 'Europe/Madrid')::date >= v_today
    union
    select x from availability_rules r, availability_rule_days(r.day, r.repeat, r.until_day) as x
    where x >= v_today
  ) as s;

  foreach v_day in array v_days loop
    if availability_day_ranges(v_day) is distinct from coalesce(
         (select range_agg(tstzrange(w.starts_at, w.ends_at, '[)'))
          from availability_windows w
          where (w.starts_at at time zone 'Europe/Madrid')::date = v_day),
         '{}'::tstzmultirange) then
      raise exception 'La disponibilidad convertida no coincide con la actual el %. No se ha migrado nada.', v_day;
    end if;
  end loop;

  -- Deja las franjas futuras exactamente como las derivan los rangos
  perform rebuild_availability(v_days);
end $$;

-- ===== Lo que sustituye esta migración =====
drop function if exists public.save_month_availability(text, smallint[], jsonb, jsonb, jsonb);
drop function if exists public.save_month_availability(text, jsonb, jsonb, jsonb);
drop table if exists public.availability_months;

-- ===== RLS y permisos =====
alter table public.availability_rules enable row level security;
create policy rules_admin_read on public.availability_rules for select to authenticated
  using (public.is_admin());
revoke all on public.availability_rules from anon;
revoke insert, update, delete, truncate on public.availability_rules from authenticated;

-- Las franjas solo las escribe rebuild_availability: el admin ya no puede tocarlas
-- directamente (así nunca se separan de los rangos)
drop policy windows_admin on public.availability_windows;
create policy windows_admin_read on public.availability_windows for select to authenticated
  using (public.is_admin());
revoke insert, update, delete, truncate on public.availability_windows from authenticated;

revoke all on function public.availability_rule_days(date, public.availability_repeat, date) from public, anon, authenticated;
revoke all on function public.availability_day_ranges(date) from public, anon, authenticated;
revoke all on function public.rebuild_availability(date[]) from public, anon, authenticated;
revoke all on function public.save_availability_rule(public.availability_kind, date, time, time, public.availability_repeat, date, uuid) from public, anon, authenticated;
revoke all on function public.delete_availability_rule(uuid) from public, anon, authenticated;

grant execute on function public.save_availability_rule(public.availability_kind, date, time, time, public.availability_repeat, date, uuid) to authenticated;
grant execute on function public.delete_availability_rule(uuid) to authenticated;
