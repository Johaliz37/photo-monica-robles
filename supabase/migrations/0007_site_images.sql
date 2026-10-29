-- =====================================================================
-- Imágenes de la home editables desde /admin/imagenes.
--
-- - Secciones fijas (una foto cada una): 'extras' (Adicionales), 'info'
--   (Información adicional) y 'christmas_session' (tarjeta «vuestra sesión
--   de Navidad» de Espadilla). Si no hay fila, la web usa la foto del código.
-- - 'carousel': varias fotos, ordenadas por sort_order.
--
-- Los archivos viven en el bucket PÚBLICO `site-images` (URL pública, sin
-- firmar). En la tabla se guarda solo el nombre del archivo (path).
-- Seguridad: solo el admin lee y escribe la tabla; la web pública llama a
-- get_site_images(), que devuelve solo lo necesario para pintar las fotos.
-- =====================================================================

create table public.site_images (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('extras', 'info', 'christmas_session', 'carousel')),
  path text not null unique check (path ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  alt text not null default '' check (char_length(alt) <= 200),
  width int not null check (width > 0),
  height int not null check (height > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Una sola foto en cada sección fija
create unique index site_images_one_per_section on public.site_images (section)
  where section <> 'carousel';

alter table public.site_images enable row level security;
create policy site_images_admin on public.site_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.site_images from anon;

-- ===== RPC pública: fotos para la web =====
create function public.get_site_images()
  returns table (
    section text,
    path text,
    alt text,
    width int,
    height int,
    sort_order int
  )
  language sql stable security definer set search_path = public as $$
  select s.section, s.path, s.alt, s.width, s.height, s.sort_order
  from site_images s
  order by s.section, s.sort_order, s.created_at
$$;

revoke all on function public.get_site_images() from public, anon, authenticated;
grant execute on function public.get_site_images() to anon, authenticated;

-- ===== RPC admin: reordenar el carrusel de una vez =====
create function public.reorder_carousel(p_ids uuid[])
  returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  update site_images s
     set sort_order = o.ord::int
    from unnest(p_ids) with ordinality as o(id, ord)
   where s.id = o.id and s.section = 'carousel';
end;
$$;

revoke all on function public.reorder_carousel(uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_carousel(uuid[]) to authenticated;

-- ===== Storage: fotos de la home =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy site_images_admin_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-images'
    and public.is_admin()
    and name ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  );
create policy site_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and public.is_admin());
-- El borrado necesita poder ver la fila: solo el admin (el público descarga por URL pública)
create policy site_images_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'site-images' and public.is_admin());
