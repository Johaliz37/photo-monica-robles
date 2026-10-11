-- =====================================================================
-- Perfil de la fotógrafa, editable desde /admin/perfil.
--
-- Una sola fila (id = true) con los datos que se muestran en la web pública:
-- nombre, teléfono, email, Bizum, redes sociales y el texto "Sobre mí".
--
-- Seguridad: solo el admin lee y escribe la tabla (RLS con is_admin()). La web
-- pública NO lee la tabla: llama a get_public_profile(), que devuelve solo
-- estos campos, todos pensados para publicarse.
-- =====================================================================

create table public.profile (
  id boolean primary key default true check (id),
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text not null default '' check (phone = '' or phone ~ '^\+?[0-9 ]{9,20}$'),
  email text not null default '' check (email = '' or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  bizum text not null default '' check (bizum = '' or bizum ~ '^\+?[0-9 ]{9,20}$'),
  -- Redes sociales: solo el nombre de usuario (sin @ ni URL)
  instagram text not null default '' check (instagram ~ '^[A-Za-z0-9._]{0,30}$'),
  facebook text not null default '' check (facebook ~ '^[A-Za-z0-9.\-]{0,80}$'),
  tiktok text not null default '' check (tiktok ~ '^[A-Za-z0-9._]{0,30}$'),
  about text not null default '' check (char_length(about) <= 3000),
  updated_at timestamptz not null default now()
);

alter table public.profile enable row level security;
create policy profile_admin on public.profile for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.profile from anon;

-- Fila inicial con lo que ya publicaba la web (src/content/site.ts)
insert into public.profile (id, instagram) values (true, 'monicarobles_fotografia');

-- ===== RPC pública: datos del perfil para la web =====
create or replace function public.get_public_profile()
  returns table (
    full_name text,
    phone text,
    email text,
    bizum text,
    instagram text,
    facebook text,
    tiktok text,
    about text
  )
  language sql stable security definer set search_path = public as $$
  select p.full_name, p.phone, p.email, p.bizum, p.instagram, p.facebook, p.tiktok, p.about
  from profile p
  where p.id
$$;

revoke all on function public.get_public_profile() from public, anon, authenticated;
grant execute on function public.get_public_profile() to anon, authenticated;
