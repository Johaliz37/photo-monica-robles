-- =====================================================================
-- Foto de portada (la primera que se ve al cargar la home) editable desde
-- /admin/imagenes: nueva sección fija 'hero'. Si no hay fila, la web usa la
-- foto del código. Una sola foto, como el resto de secciones fijas
-- (índice site_images_one_per_section).
-- =====================================================================

alter table public.site_images drop constraint site_images_section_check;
alter table public.site_images add constraint site_images_section_check
  check (section in ('hero', 'extras', 'info', 'christmas_session', 'carousel'));
