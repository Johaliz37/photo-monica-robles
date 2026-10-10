# Fase 3 — Supabase: base de datos, seguridad y storage

## Objetivo
Backend gratuito y seguro: tablas, restricción anti-solapes, RLS, RPCs públicas (`get_availability`, `create_booking`), RPCs de admin, bucket privado de comprobantes y una única usuaria admin.

## Prerrequisitos
- Cuenta en supabase.com (plan Free).
- Fase 1 completada (cliente `src/lib/supabase.ts`).

## Tareas

### 3.1 Crear el proyecto
1. Crear el proyecto **"monica-robles-navidad"**, región **Central EU (Frankfurt)** (RGPD), con una contraseña de BD fuerte guardada en un gestor de contraseñas.
2. **Authentication → Sign In / Providers**:
   - Email activado;
   - **"Allow new users to sign up" desactivado**;
   - confirmación de email no necesaria (la usuaria se crea a mano).
3. **Authentication → Users → Add user**: crear a Mónica (email y contraseña) y anotar su `user id`.
4. Copiar `Project URL` y la **publishable key** (o la anon key en proyectos *legacy*) a `.env.local`.

### 3.2 Migración `supabase/migrations/0001_init.sql`
Se aplica pegándola en el **SQL Editor** o con `supabase db push` si se instala la CLI (opcional, también gratuita).

```sql
-- ===== Configuración (debe coincidir con src/content/site.ts → BOOKING / PRESALE) =====
create or replace function public.cfg_baby_extra_min()   returns int language sql immutable as $$ select 15 $$;
create or replace function public.cfg_baby_extra_cents() returns int language sql immutable as $$ select 2000 $$;
create or replace function public.cfg_buffer_min()       returns int language sql immutable as $$ select 15 $$;
create or replace function public.cfg_step_min()         returns int language sql immutable as $$ select 15 $$;
create or replace function public.cfg_deposit_cents()    returns int language sql immutable as $$ select 2000 $$;
create or replace function public.cfg_presale_starts()   returns timestamptz language sql immutable as $$ select timestamptz '2026-10-11 00:00:00 Europe/Madrid' $$;
create or replace function public.cfg_presale_ends()     returns timestamptz language sql immutable as $$ select timestamptz '2026-10-16 23:59:59 Europe/Madrid' $$;

-- ===== Admins =====
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
-- insert into public.admins values ('<UUID de Mónica>');   -- ejecutar a mano

-- ===== Paquetes (semilla fija) =====
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
create extension if not exists btree_gist;
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
  exclude using gist (tstzrange(starts_at, blocked_until, '[)') with &&) where (status <> 'rechazada')
);
create index on public.bookings (status, starts_at);

-- Impedir borrar franjas con reservas activas dentro
create or replace function public.prevent_window_delete() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.bookings b
             where b.status <> 'rechazada'
               and b.starts_at >= old.starts_at and b.starts_at < old.ends_at) then
    raise exception 'WINDOW_HAS_BOOKINGS';
  end if;
  return old;
end $$;
create trigger trg_prevent_window_delete before delete or update of starts_at, ends_at
  on public.availability_windows for each row execute function public.prevent_window_delete();
```
Nota: en un UPDATE el trigger también bloquea si hay reservas. Para el MVP basta con "borrar y crear de nuevo".

### 3.3 RLS
```sql
alter table public.admins               enable row level security;
alter table public.packages             enable row level security;
alter table public.availability_windows enable row level security;
alter table public.bookings             enable row level security;

create policy packages_read  on public.packages for select using (true);
create policy admins_self    on public.admins   for select using (user_id = auth.uid());
create policy windows_admin  on public.availability_windows for all using (public.is_admin()) with check (public.is_admin());
create policy bookings_admin on public.bookings for all using (public.is_admin()) with check (public.is_admin());
-- anon: sin políticas sobre windows/bookings ⇒ sin acceso directo. Solo vía RPC.
```

### 3.4 RPC pública `get_availability`
```sql
create or replace function public.get_availability(p_from timestamptz, p_to timestamptz)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'windows', coalesce((select json_agg(json_build_object('starts_at', starts_at, 'ends_at', ends_at) order by starts_at)
                         from availability_windows where ends_at > greatest(p_from, now()) and starts_at < p_to), '[]'),
    'busy',    coalesce((select json_agg(json_build_object('starts_at', starts_at, 'blocked_until', blocked_until))
                         from bookings where status <> 'rechazada' and blocked_until > p_from and starts_at < p_to), '[]'),
    'config',  json_build_object('baby_extra_min', cfg_baby_extra_min(), 'buffer_min', cfg_buffer_min(), 'step_min', cfg_step_min())
  ) where p_to - p_from <= interval '62 days';   -- limita el rango consultable
$$;
revoke all on function public.get_availability(timestamptz, timestamptz) from public;
grant execute on function public.get_availability(timestamptz, timestamptz) to anon, authenticated;
```

### 3.5 RPC pública `create_booking`
Pseudocódigo (implementar en `plpgsql`, `security definer`, `set search_path = public`):
1. Si `p_privacy_consent` no es true → `raise exception 'CONSENT_REQUIRED'`.
2. Cargar el paquete; si no existe → `INVALID_PACKAGE`.
3. `v_dur := duration_min + case when p_baby then cfg_baby_extra_min() else 0 end`, `v_end := p_starts_at + v_dur min` y `v_blocked := v_end + cfg_buffer_min() min`.
4. Si `p_starts_at <= now() + interval '2 hours'` → `PAST_TIME` (antelación mínima, ajustable).
5. Debe existir una franja `w` con `w.starts_at <= p_starts_at` y `v_end <= w.ends_at`, y además `extract(epoch from p_starts_at - w.starts_at)` debe ser múltiplo de `cfg_step_min()*60`. Si no → `OUT_OF_WINDOW`.
6. `p_receipt_path ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$'` y debe existir en `storage.objects` (`bucket_id = 'receipts'`). Si no → `RECEIPT_MISSING`.
7. Si hay 3 o más reservas `pendiente` con el mismo `lower(email)` o el mismo teléfono normalizado → `TOO_MANY_PENDING`.
8. Precio: `presale_price_cents` si `now()` está entre `cfg_presale_starts()` y `cfg_presale_ends()`; si no, `price_cents`. Sumar `cfg_baby_extra_cents()` si hay bebé.
9. `insert … returning id`. Capturar `exclusion_violation` → `SLOT_TAKEN` y `unique_violation` (receipt) → `RECEIPT_REUSED`.
10. `grant execute … to anon`.

Firma:
`create_booking(p_package_code text, p_baby_extension boolean, p_starts_at timestamptz, p_client_name text, p_email text, p_phone text, p_participants text, p_notes text, p_receipt_path text, p_privacy_consent boolean) returns uuid`.
Normalizar con `trim()`, pasar el email a `lower()` y quitar los espacios del teléfono.

### 3.6 RPCs / operaciones de admin
Son operaciones directas con RLS (`is_admin()`):
- listar reservas: `from('bookings').select('*').eq('status', …).order('starts_at')`;
- revisar: RPC `review_booking(p_id uuid, p_status booking_status, p_note text)` (`security invoker`) que comprueba `is_admin()`, solo permite pasar de `pendiente` a `aceptada`/`rechazada` (o de `aceptada` a `rechazada` para cancelaciones) y fija `reviewed_at = now()`. Aceptar una reserva rechazada no está permitido, porque su hueco puede estar ya ocupado (la restricción lo impediría igualmente);
- franjas: insert/delete directos sobre `availability_windows`.

### 3.7 Storage
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf']);

create policy receipts_anon_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'receipts' and name ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$');
create policy receipts_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and public.is_admin());
create policy receipts_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and public.is_admin());
```
No hay política de UPDATE, así que el cliente sube con `upsert: false` y no puede sobrescribir. Los comprobantes huérfanos (subidos sin reserva final) se limpian a mano desde el panel o el dashboard. Ocupan poco.

### 3.8 Registrar la admin
`insert into public.admins values ('<UUID de Mónica>');`

### 3.9 Tipos TypeScript
Generar `src/lib/database.types.ts` con `npx supabase gen types typescript --project-id <id>` (la CLI de Supabase es gratuita) y tipar `createClient<Database>`.

## Archivos creados
`supabase/migrations/0001_init.sql`, `src/lib/database.types.ts` y `.env.local` (no versionado).

## Criterios de aceptación
- `anon` no puede hacer `select` en `bookings`, `availability_windows` ni `admins` (devuelve 0 filas o error).
- `anon` no puede leer ni listar objetos de `receipts`.
- Dos reservas solapadas → la segunda falla con `SLOT_TAKEN`.
- Una reserva fuera de franja, en el pasado, sin comprobante o sin consentimiento falla con su código.
- Rechazar una reserva permite volver a reservar ese hueco.
- No se puede borrar una franja con reservas activas.

## Verificación (SQL Editor + script)
1. Insertar como admin (en el SQL editor, como `postgres`) una franja de mañana de 10:00 a 12:00 (Madrid).
2. Subir un archivo de prueba al bucket desde el dashboard con el nombre `<uuid>.png`.
3. `select create_booking('P3', false, '<mañana 10:00>', 'Test', 't@t.es', '600000000', '2 niños', null, '<uuid>.png', true);` → OK.
4. Repetir con `P1` a las 10:30 → `SLOT_TAKEN` (porque 10:00 + 45 + 15 = 11:00).
5. Con `P1` a las 11:00 → OK (con otro comprobante).
6. Con la anon key, desde `curl` o la consola del navegador:
   - `supabase.from('bookings').select()` → `[]`;
   - `supabase.storage.from('receipts').list()` → vacío o error.
7. `update bookings set status='rechazada' …` y reintentar el paso 4 → OK.
