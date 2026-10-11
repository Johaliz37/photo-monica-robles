-- =====================================================================
-- Perfil: interruptor para mostrar "Sobre mí" en la home y foto de perfil.
--
-- La foto vive en el bucket PÚBLICO `avatars` (se sirve por URL pública, sin
-- firmar). Solo el admin puede subir y borrar; nadie puede listar el bucket.
-- En la tabla se guarda solo el nombre del archivo (photo_path).
-- =====================================================================

alter table public.profile
  add column show_about boolean not null default true,
  add column photo_path text not null default ''
    check (photo_path = '' or photo_path ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$');

-- ===== RPC pública: cambia el tipo de retorno, hay que recrearla =====
drop function public.get_public_profile();

create function public.get_public_profile()
  returns table (
    full_name text,
    phone text,
    email text,
    bizum text,
    instagram text,
    facebook text,
    tiktok text,
    about text,
    show_about boolean,
    photo_path text
  )
  language sql stable security definer set search_path = public as $$
  select p.full_name, p.phone, p.email, p.bizum, p.instagram, p.facebook, p.tiktok, p.about,
         p.show_about, p.photo_path
  from profile p
  where p.id
$$;

revoke all on function public.get_public_profile() from public, anon, authenticated;
grant execute on function public.get_public_profile() to anon, authenticated;

-- ===== Storage: foto de perfil =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy avatars_admin_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and public.is_admin()
    and name ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  );
create policy avatars_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.is_admin());
-- El borrado necesita poder ver la fila: solo el admin (el público descarga por URL pública)
create policy avatars_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.is_admin());
