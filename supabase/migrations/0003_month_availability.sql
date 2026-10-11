-- =====================================================================
-- Disponibilidad por mes, editable.
--
-- El admin define una base por mes (días de la semana + una o varias franjas
-- horarias) y excepciones por día (horas en las que NO está disponible). La
-- configuración se guarda en availability_months y, al guardar, se reemplazan
-- en una sola transacción las franjas del mes de hoy en adelante.
--
-- availability_windows sigue siendo lo único que consultan get_availability y
-- create_booking: este cambio no toca la parte pública.
-- =====================================================================

create table public.availability_months (
  month text primary key check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  -- 0 = lunes … 6 = domingo
  weekdays smallint[] not null default '{}',
  -- [{"start":"09:00","end":"14:00"}, …] (hora de Madrid)
  ranges jsonb not null default '[]',
  -- [{"day":"2026-11-07","start":"10:00","end":"11:00"}, …] (hora de Madrid)
  exclusions jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.availability_months enable row level security;
create policy months_admin on public.availability_months for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.availability_months from anon;

-- El trigger que impide borrar franjas con reservas se salta solo dentro de
-- save_month_availability, que antes comprueba que todas las reservas activas
-- quedan cubiertas por las franjas nuevas.
create or replace function public.prevent_window_delete() returns trigger
  language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('app.replacing_windows', true), '') <> 'on'
     and exists (select 1 from public.bookings b
                 where b.status <> 'rechazada'
                   and b.starts_at >= old.starts_at and b.starts_at < old.ends_at) then
    raise exception 'WINDOW_HAS_BOOKINGS';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

-- ===== RPC de admin: guardar la disponibilidad de un mes =====
-- p_windows: [{"starts_at": "...", "ends_at": "..."}] calculadas en el panel a partir
-- de la configuración. Se reemplazan las franjas del mes desde hoy (hora de Madrid);
-- los días ya pasados no se tocan.
create or replace function public.save_month_availability(
  p_month text,
  p_weekdays smallint[],
  p_ranges jsonb,
  p_exclusions jsonb,
  p_windows jsonb
) returns void
  language plpgsql security invoker set search_path = public as $$
declare
  v_month_start timestamptz;
  v_month_end   timestamptz;
  v_from        timestamptz;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  if p_month is null or p_month !~ '^\d{4}-(0[1-9]|1[0-2])$'
     or jsonb_typeof(coalesce(p_windows, '[]')) <> 'array' then
    raise exception 'INVALID_DATA';
  end if;

  v_month_start := ((p_month || '-01')::date)::timestamp at time zone 'Europe/Madrid';
  v_month_end   := ((p_month || '-01')::date + interval '1 month')::timestamp at time zone 'Europe/Madrid';
  v_from        := greatest(v_month_start,
                            date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid');

  if v_from >= v_month_end then
    raise exception 'PAST_MONTH';
  end if;

  -- Las franjas nuevas deben estar dentro del mes, desde hoy
  if exists (select 1 from jsonb_to_recordset(coalesce(p_windows, '[]'))
                    as n(starts_at timestamptz, ends_at timestamptz)
             where n.starts_at is null or n.ends_at is null or n.ends_at <= n.starts_at
                or n.starts_at < v_from or n.ends_at > v_month_end) then
    raise exception 'INVALID_DATA';
  end if;

  -- Mismo bloqueo que create_booking: nadie reserva mientras se reemplazan las franjas
  perform pg_advisory_xact_lock(hashtext('public.create_booking'));

  -- Ninguna reserva activa puede quedarse fuera de las franjas nuevas
  if exists (
    select 1 from bookings b
    where b.status <> 'rechazada' and b.starts_at >= v_from and b.starts_at < v_month_end
      and not exists (select 1 from jsonb_to_recordset(coalesce(p_windows, '[]'))
                             as n(starts_at timestamptz, ends_at timestamptz)
                      where n.starts_at <= b.starts_at and b.ends_at <= n.ends_at)
  ) then
    raise exception 'BOOKINGS_OUTSIDE_WINDOWS';
  end if;

  perform set_config('app.replacing_windows', 'on', true);
  delete from availability_windows where starts_at >= v_from and starts_at < v_month_end;
  perform set_config('app.replacing_windows', 'off', true);

  begin
    insert into availability_windows (starts_at, ends_at)
    select n.starts_at, n.ends_at
    from jsonb_to_recordset(coalesce(p_windows, '[]')) as n(starts_at timestamptz, ends_at timestamptz);
  exception
    when exclusion_violation then
      raise exception 'WINDOW_OVERLAP';
  end;

  insert into availability_months (month, weekdays, ranges, exclusions, updated_at)
  values (p_month, coalesce(p_weekdays, '{}'), coalesce(p_ranges, '[]'), coalesce(p_exclusions, '[]'), now())
  on conflict (month) do update
    set weekdays = excluded.weekdays,
        ranges = excluded.ranges,
        exclusions = excluded.exclusions,
        updated_at = excluded.updated_at;
end $$;

revoke all on function public.save_month_availability(text, smallint[], jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_month_availability(text, smallint[], jsonb, jsonb, jsonb) to authenticated;
