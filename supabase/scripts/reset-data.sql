-- =====================================================================
-- Limpia la base de datos SIN tocar los usuarios (auth.users ni admins).
-- Para borrar los datos de prueba antes de abrir la web al público.
--
-- Cómo usarlo: copiar todo en Supabase → SQL Editor → Run. Es irreversible.
--
-- Borra: reservas, rangos y franjas de disponibilidad, y
-- restablece el perfil a los valores iniciales (migraciones 0004 y 0005).
-- Si quieres conservar el perfil, quita el bloque "Perfil".
-- No toca: auth.users, admins ni packages (semilla fija).
--
-- Los archivos de Storage NO se pueden borrar con SQL (Supabase lo bloquea).
-- Después de ejecutar esto, vacía los buckets en el dashboard:
--   Storage → receipts → … → Empty bucket
--   Storage → avatars  → … → Empty bucket   (solo si también limpias el perfil)
-- =====================================================================

begin;

-- Reservas primero: el trigger impide borrar franjas con reservas activas
delete from public.bookings;
delete from public.availability_rules;
delete from public.availability_windows;

-- Perfil
insert into public.profile (id, full_name, phone, email, bizum, instagram, facebook, tiktok,
                            about, show_about, photo_path, updated_at)
values (true, '', '', '', '', 'monicarobles_fotografia', '', '', '', true, '', now())
on conflict (id) do update
  set full_name  = excluded.full_name,
      phone      = excluded.phone,
      email      = excluded.email,
      bizum      = excluded.bizum,
      instagram  = excluded.instagram,
      facebook   = excluded.facebook,
      tiktok     = excluded.tiktok,
      about      = excluded.about,
      show_about = excluded.show_about,
      photo_path = excluded.photo_path,
      updated_at = excluded.updated_at;

commit;

-- Comprobación: todo a 0 salvo admins, packages (3) y profile (1)
select 'bookings' as tabla, count(*) from public.bookings
union all select 'availability_windows', count(*) from public.availability_windows
union all select 'availability_rules',   count(*) from public.availability_rules
union all select 'profile',              count(*) from public.profile
union all select 'packages',             count(*) from public.packages
union all select 'admins',               count(*) from public.admins
union all select 'auth.users',           count(*) from auth.users;
