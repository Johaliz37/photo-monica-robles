-- =====================================================================
-- Mónica Robles Fotografía · Navidad 2026 — esquema inicial
-- Tablas, anti-solapes, RLS, RPCs públicas y de admin, bucket de comprobantes.
-- =====================================================================

-- ===== Configuración (debe coincidir con src/content/site.ts → BOOKING / PRESALE) =====
create or replace function public.cfg_baby_extra_min()   returns int language sql immutable as $$ select 15 $$;
create or replace function public.cfg_baby_extra_cents() returns int language sql immutable as $$ select 2000 $$;
create or replace function public.cfg_buffer_min()       returns int language sql immutable as $$ select 15 $$;
create or replace function public.cfg_step_min()         returns int language sql immutable as $$ select 15 $$;
create or replace function public.cfg_deposit_cents()    returns int language sql immutable as $$ select 2000 $$;
-- Antelación mínima para reservar
create or replace function public.cfg_min_notice()       returns interval language sql immutable as $$ select interval '2 hours' $$;
create or replace function public.cfg_presale_starts()   returns timestamptz language sql immutable as $$ select timestamptz '2026-10-11 00:00:00+02' $$;
create or replace function public.cfg_presale_ends()     returns timestamptz language sql immutable as $$ select timestamptz '2026-10-16 23:59:59+02' $$;

-- ===== Admins =====
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
-- insert into public.admins values ('<UUID de Mónica>');   -- ejecutar a mano

-- ===== Paquetes (semilla fija, debe coincidir con src/content/packages.ts) =====
create table public.packages (
  code text primary key check (code in ('P1','P2','P3')),
  name text not null,
  duration_min int not null check (duration_min > 0),
  price_cents int not null,
  presale_price_cents int not null
);
insert into public.packages values
  ('P1','Paquete 01',30, 8500, 7650),
  ('P2','Paquete 02',30,14500,13050),
  ('P3','Paquete 03',45,19500,17550);

-- ===== Franjas de disponibilidad =====
create extension if not exists btree_gist with schema extensions;

create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)   -- franjas no solapadas
);

-- ===== Reservas =====
create type public.booking_status as enum ('pendiente','aceptada','rechazada');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  package_code text not null references public.packages(code),
  baby_extension boolean not null default false,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  blocked_until timestamptz not null,
  price_cents int not null,
  deposit_cents int not null,
  client_name text not null check (char_length(client_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (phone ~ '^\+?[0-9 ]{9,16}$'),
  participants text not null check (char_length(participants) <= 300),
  notes text check (char_length(notes) <= 1000),
  receipt_path text not null unique,
  status public.booking_status not null default 'pendiente',
  admin_note text,
  reviewed_at timestamptz,
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and blocked_until >= ends_at),
  -- Anti-solapes: las reservas activas (incluido el margen) no pueden pisarse
  constraint bookings_no_overlap
    exclude using gist (tstzrange(starts_at, blocked_until, '[)') with &&) where (status <> 'rechazada')
);
create index on public.bookings (status, starts_at);

-- Impedir borrar (o mover) franjas con reservas activas dentro
create or replace function public.prevent_window_delete() returns trigger
  language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.bookings b
             where b.status <> 'rechazada'
               and b.starts_at >= old.starts_at and b.starts_at < old.ends_at) then
    raise exception 'WINDOW_HAS_BOOKINGS';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create trigger trg_prevent_window_delete before delete or update of starts_at, ends_at
  on public.availability_windows for each row execute function public.prevent_window_delete();

-- ===== RLS =====
alter table public.admins               enable row level security;
alter table public.packages             enable row level security;
alter table public.availability_windows enable row level security;
alter table public.bookings             enable row level security;

create policy packages_read  on public.packages for select using (true);
create policy admins_self    on public.admins   for select using (user_id = auth.uid());
create policy windows_admin  on public.availability_windows for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy bookings_admin on public.bookings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- anon: sin acceso directo a franjas, reservas ni admins. Solo vía RPC.
-- (Supabase concede permisos de tabla a anon por defecto; los quitamos además de la RLS.)
revoke all on public.admins, public.availability_windows, public.bookings from anon;
revoke insert, update, delete, truncate on public.packages from anon, authenticated;
revoke insert, update, delete, truncate on public.admins from authenticated;

-- ===== RPC pública: disponibilidad =====
create or replace function public.get_availability(p_from timestamptz, p_to timestamptz)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if p_to <= p_from or p_to - p_from > interval '62 days' then
    raise exception 'INVALID_RANGE';
  end if;
  return json_build_object(
    'windows', coalesce((select json_agg(json_build_object('starts_at', w.starts_at, 'ends_at', w.ends_at) order by w.starts_at)
                         from availability_windows w
                         where w.ends_at > greatest(p_from, now()) and w.starts_at < p_to), '[]'),
    'busy',    coalesce((select json_agg(json_build_object('starts_at', b.starts_at, 'blocked_until', b.blocked_until) order by b.starts_at)
                         from bookings b
                         where b.status <> 'rechazada' and b.blocked_until > p_from and b.starts_at < p_to), '[]'),
    'config',  json_build_object('baby_extra_min', cfg_baby_extra_min(),
                                 'buffer_min',     cfg_buffer_min(),
                                 'step_min',       cfg_step_min(),
                                 'min_notice_min', extract(epoch from cfg_min_notice())::int / 60)
  );
end $$;

-- ===== RPC pública: crear reserva =====
create or replace function public.create_booking(
  p_package_code text,
  p_baby_extension boolean,
  p_starts_at timestamptz,
  p_client_name text,
  p_email text,
  p_phone text,
  p_participants text,
  p_notes text,
  p_receipt_path text,
  p_privacy_consent boolean
) returns uuid
  language plpgsql volatile security definer set search_path = public as $$
declare
  v_pkg     packages%rowtype;
  v_baby    boolean := coalesce(p_baby_extension, false);
  v_dur     int;
  v_end     timestamptz;
  v_blocked timestamptz;
  v_name    text := trim(p_client_name);
  v_email   text := lower(trim(p_email));
  v_phone   text := replace(trim(p_phone), ' ', '');
  v_part    text := trim(p_participants);
  v_notes   text := nullif(trim(p_notes), '');
  v_receipt text := trim(p_receipt_path);
  v_price   int;
  v_id      uuid;
begin
  -- 1. Consentimiento
  if p_privacy_consent is not true then
    raise exception 'CONSENT_REQUIRED';
  end if;

  -- 2. Paquete
  select * into v_pkg from packages where code = p_package_code;
  if not found then
    raise exception 'INVALID_PACKAGE';
  end if;

  -- 3. Duración y bloqueo (sesión + margen)
  v_dur     := v_pkg.duration_min + case when v_baby then cfg_baby_extra_min() else 0 end;
  v_end     := p_starts_at + make_interval(mins => v_dur);
  v_blocked := v_end + make_interval(mins => cfg_buffer_min());

  -- 4. Antelación mínima
  if p_starts_at is null or p_starts_at <= now() + cfg_min_notice() then
    raise exception 'PAST_TIME';
  end if;

  -- 5. Dentro de una franja y alineada al paso
  if not exists (
    select 1 from availability_windows w
    where w.starts_at <= p_starts_at and v_end <= w.ends_at
      and mod(extract(epoch from p_starts_at - w.starts_at)::bigint, cfg_step_min() * 60) = 0
  ) then
    raise exception 'OUT_OF_WINDOW';
  end if;

  -- 6. Comprobante subido
  if v_receipt is null
     or v_receipt !~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$'
     or not exists (select 1 from storage.objects o where o.bucket_id = 'receipts' and o.name = v_receipt) then
    raise exception 'RECEIPT_MISSING';
  end if;

  -- 7. Límite de reservas pendientes por cliente
  if (select count(*) from bookings b
      where b.status = 'pendiente' and (lower(b.email) = v_email or b.phone = v_phone)) >= 3 then
    raise exception 'TOO_MANY_PENDING';
  end if;

  -- 8. Precio (lo calcula el servidor)
  v_price := case when now() between cfg_presale_starts() and cfg_presale_ends()
                  then v_pkg.presale_price_cents else v_pkg.price_cents end
           + case when v_baby then cfg_baby_extra_cents() else 0 end;

  -- 9. Insertar
  begin
    insert into bookings (package_code, baby_extension, starts_at, ends_at, blocked_until,
                          price_cents, deposit_cents, client_name, email, phone,
                          participants, notes, receipt_path, privacy_consent_at)
    values (v_pkg.code, v_baby, p_starts_at, v_end, v_blocked,
            v_price, cfg_deposit_cents(), v_name, v_email, v_phone,
            v_part, v_notes, v_receipt, now())
    returning id into v_id;
  exception
    when exclusion_violation then
      raise exception 'SLOT_TAKEN';
    when unique_violation then
      raise exception 'RECEIPT_REUSED';
    when check_violation or not_null_violation then
      raise exception 'INVALID_DATA';
  end;

  return v_id;
end $$;

-- ===== RPC de admin: revisar reserva =====
create or replace function public.review_booking(p_id uuid, p_status public.booking_status, p_note text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_current booking_status;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select status into v_current from bookings where id = p_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  -- pendiente → aceptada | rechazada;  aceptada → rechazada (cancelación)
  if not ((v_current = 'pendiente' and p_status in ('aceptada','rechazada'))
          or (v_current = 'aceptada' and p_status = 'rechazada')) then
    raise exception 'INVALID_TRANSITION';
  end if;

  update bookings
     set status = p_status,
         admin_note = nullif(trim(p_note), ''),
         reviewed_at = now()
   where id = p_id;
end $$;

-- ===== Permisos de funciones =====
-- Supabase concede EXECUTE a anon por defecto: se revoca todo y se concede solo lo necesario.
revoke all on function public.get_availability(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.create_booking(text, boolean, timestamptz, text, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.review_booking(uuid, public.booking_status, text) from public, anon, authenticated;
revoke all on function public.prevent_window_delete() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;

grant execute on function public.get_availability(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.create_booking(text, boolean, timestamptz, text, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.review_booking(uuid, public.booking_status, text) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ===== Storage: comprobantes =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy receipts_anon_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'receipts' and name ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$');
create policy receipts_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and public.is_admin());
create policy receipts_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and public.is_admin());
-- Sin política de UPDATE: el cliente sube con upsert: false y no puede sobrescribir.
