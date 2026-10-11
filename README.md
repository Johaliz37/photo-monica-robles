# Mónica Robles Fotografía · Navidad 2026

SPA para vender los paquetes de Navidad 2026 y gestionar las reservas. Ver [CLAUDE.md](CLAUDE.md) para el stack, los comandos y las reglas del proyecto, y [docs/fases/](docs/fases/) para el plan.

## Uso diario (para Mónica)

1. Entrar en `https://<web>/admin` con el email y la contraseña de admin.
2. **Disponibilidad** (`/admin/disponibilidad`): crear las franjas en las que se puede reservar (día, hora de inicio y de fin). La web pública solo ofrece huecos dentro de esas franjas, con 15 min de margen entre sesiones. Una franja con reservas no se puede borrar.
3. **Reservas** (`/admin`): las nuevas aparecen como _pendiente_. Abrir cada una, comprobar el comprobante del adelanto (20 €) y marcarla como **aceptada** o **rechazada**. Una reserva rechazada libera el hueco al momento.

No hay avisos por email ni WhatsApp: conviene entrar al panel cada día durante la campaña.

## Despliegue

Coste 0 €: Cloudflare Workers (static assets) + Supabase Free + GitHub Actions. Cada push a `main` despliega a producción; las demás ramas generan una _preview_ con su propia URL (útil para que Mónica revise cambios).

### GitHub

- Repo **privado**. No se suben `.env.local`, `node_modules/`, `dist/` ni el PDF (ver `.gitignore`). `public/img/` **sí** se sube: Cloudflare no ejecuta `npm run images`.
- **Settings → Secrets and variables → Actions**: `SUPABASE_URL` y `SUPABASE_ANON_KEY` (para el keepalive).

### Cloudflare Workers (static assets)

**Workers & Pages → Create → Import a repository** → elegir el repo, con:

| Ajuste                         | Valor                                                       |
| ------------------------------ | ----------------------------------------------------------- |
| Build command                  | vacío (lo ejecuta `[build]` de `wrangler.toml`)             |
| Deploy command                 | `npx wrangler deploy`                                       |
| Variables de **build**         | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` |

La configuración del Worker está en [wrangler.toml](wrangler.toml): sirve `dist/` y, con `not_found_handling = "single-page-application"`, devuelve `index.html` en las rutas de la SPA, así que se puede recargar `/reservar` y `/admin`. **No** se usa `public/_redirects`: Workers rechaza la regla `/* /index.html 200` (error 100324, "Infinite loop detected").

Las `VITE_*` se inyectan al compilar, así que van en **Settings → Build → Variables and secrets**, no en las variables del Worker (esas son de runtime y Vite no las ve). Node 24 se toma de `.nvmrc`. `VITE_SITE_URL` es la URL pública sin barra final: tras el primer deploy, poner la de `workers.dev` (o el dominio) y volver a desplegar.

### Supabase (producción)

- **Authentication → URL Configuration**: `Site URL` = la URL pública; añadirla también a `Redirect URLs`.
- **Authentication → Sign In / Providers**: _Allow new users to sign up_ **desactivado**.
- Revisar **Security Advisor** y **Performance Advisor**: sin avisos de RLS.

### Keepalive

Supabase Free se pausa tras 7 días sin actividad. [.github/workflows/keepalive.yml](.github/workflows/keepalive.yml) llama a `get_availability` cada 3 días. Para probarlo: **Actions → supabase-keepalive → Run workflow**. GitHub desactiva los crons en repos sin commits durante 60 días; si pasa, se reactiva desde la misma pantalla.

**Si Supabase está pausado** (la web no carga huecos ni deja entrar en el panel): dashboard de Supabase → proyecto → **Restore project**. Tarda unos minutos y no se pierden datos.

### Dominio propio (opcional, ~10 €/año)

Comprarlo (p. ej. en Cloudflare Registrar), añadirlo en el Worker en **Settings → Domains & Routes → Add → Custom domain** (el SSL es automático), actualizar el `Site URL` de Supabase y `VITE_SITE_URL`, y redesplegar.

### Copias de seguridad

El plan Free no tiene backups descargables. Durante la campaña, exportar `bookings` cada semana: **Table editor → bookings → Export → CSV**. Alternativa con la CLI: `npx supabase db dump --data-only -f backup.sql` (con el proyecto enlazado).

## Cambiar precios, paquetes o textos

No hay CMS: se edita el código y se hace push (Cloudflare redespliega solo).

- Textos, fotos y paquetes visibles: [src/content/](src/content/) (`packages.ts`, `site.ts`, `legal.ts`).
- Si cambia el **precio, la duración, el adelanto o las fechas de preventa**, el servidor también debe saberlo, porque es quien calcula el importe final. Además de `packages.ts` / `site.ts`, actualizar Supabase con una nueva migración en `supabase/migrations/` (o desde el **SQL Editor**):
  - `public.packages` (precio normal, de preventa y duración de cada paquete);
  - las funciones `cfg_*` (`cfg_presale_starts`, `cfg_presale_ends`, `cfg_deposit_cents`, `cfg_baby_extra_*`, `cfg_buffer_min`…), con `create or replace function`.

  Ejemplo, ampliar la preventa hasta el 20 de octubre:

  ```sql
  create or replace function public.cfg_presale_ends() returns timestamptz language sql immutable as $$ select timestamptz '2026-10-20 23:59:59+02' $$;
  ```

  y cambiar `PRESALE` en `site.ts` para que la web muestre lo mismo.

Antes de hacer push: `npm run lint && npm test && npm run build`.

## Panel de administración (`/admin`)

### Dar de alta a Mónica

Los registros públicos están desactivados, así que el usuario se crea a mano:

1. En el dashboard de Supabase: **Authentication → Users → Add user → Create new user** (email y contraseña, marcando _Auto Confirm User_).
2. Copiar el UUID del usuario y, en **SQL Editor**, ejecutar:
   ```sql
   insert into public.admins values ('<UUID de Mónica>');
   ```

Un usuario que inicia sesión pero no está en `admins` ve "Sin acceso" y la RLS no le devuelve datos.

### Recuperar la contraseña

No hay "¿Olvidaste tu contraseña?" en el MVP. Se cambia desde el dashboard de Supabase:
**Authentication → Users →** (usuario) **→ … → Reset password** (envía un email) o, si no llega, borrar el usuario y volver a crearlo con los pasos anteriores (hay que volver a insertar su nuevo UUID en `admins`).

## Textos legales y SEO

- Los datos del titular (nombre, NIF, email y dirección opcional) están en `OWNER`, en [src/content/legal.ts](src/content/legal.ts). Mientras valgan `'TODO'`, `/privacidad` y `/aviso-legal` muestran "[pendiente]".
- `VITE_SITE_URL` (URL pública, sin barra final) hace que el build genere `sitemap.xml` y URLs absolutas en `og:image`, que WhatsApp necesita para mostrar la tarjeta. Defínela en las variables de build de Cloudflare y vuelve a desplegar si cambia el dominio. `robots.txt` (con `Disallow: /admin`) se genera siempre.

## Limpiar la base de datos

Para borrar los datos de prueba antes de abrir la web (o empezar de cero) sin tocar los usuarios. Es irreversible.

1. En **SQL Editor**, pegar y ejecutar [supabase/scripts/reset-data.sql](supabase/scripts/reset-data.sql): borra las reservas y la disponibilidad (franjas y configuración por mes) y restablece el perfil a sus valores iniciales. **No** toca `auth.users`, `admins` ni `packages`. Para conservar el perfil, quitar su bloque antes de ejecutar.
2. En **Storage**, vaciar los buckets (**… → Empty bucket**), porque los archivos no se pueden borrar con SQL: `receipts` y, si se ha limpiado el perfil, `avatars`.

## Retención de datos (enero de 2027)

La política de privacidad promete borrar los comprobantes a los **6 meses** de la sesión y el resto de datos a los **12 meses**.

1. **Comprobantes.** Los archivos de Storage no se deben borrar con SQL (`delete from storage.objects` deja el archivo huérfano y las versiones recientes de Supabase lo bloquean), así que se usa un script con la API de Storage. La `service_role` key se copia de _Project Settings → API_ y se pasa solo en la terminal, nunca en un archivo:
   ```bash
   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run purge:receipts          # simulación
   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run purge:receipts -- --yes # borra
   ```
   Alternativa sin terminal: en el dashboard, **Storage → receipts**, seleccionar los archivos y borrarlos. Para saber cuáles:
   ```sql
   select receipt_path from bookings where starts_at < now() - interval '6 months';
   ```
2. **Reservas.** Pasados 12 meses (y **después** del paso 1, que necesita las rutas), en **SQL Editor**:
   ```sql
   delete from bookings where starts_at < now() - interval '12 months';
   ```
