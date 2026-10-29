# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Regla 1
Lenguaje: Español (respuestas, textos visibles y comentarios de negocio).

## Qué es este proyecto
SPA para vender los **paquetes de sesión de fotos de Navidad 2026** de Mónica Robles (@monicarobles_fotografia) y gestionar **reservas** de sesiones. La única parte transaccional es **la reserva**; fotos, textos, paquetes y precios son **estáticos y viven en el código** (`src/content/`).

Fuente de verdad del contenido: `paquetes_navidad_2026.pdf` (no versionado, 9 páginas rasterizadas sin texto extraíble) e [images/](images/). El plan original está en [quiero-construir-una-web-steady-falcon.md](quiero-construir-una-web-steady-falcon.md) y el detalle por fases en [docs/fases/](docs/fases/). El [README.md](README.md) cubre despliegue, alta del admin, limpieza de la BD y retención de datos.

## Reglas de producto (no negociables en el MVP)
- **Sin CMS**. Paquetes y textos se cambian editando `src/content/*.ts` y redesplegando. Excepciones editables en `/admin`: la **disponibilidad**, el **perfil** (nombre, teléfono, email, Bizum, redes, "Sobre mí" y foto) y las **imágenes** de la home (una foto en Adicionales, Información adicional y la tarjeta «vuestra sesión de Navidad», y el carrusel «Momentos mágicos en familia»).
- **Coste 0 €**: solo planes gratuitos (Cloudflare Workers, Supabase Free, GitHub Actions).
- **Sin notificaciones** (ni email ni WhatsApp). Mónica entra en `/admin` para ver las reservas nuevas.
- **Adelanto de 20 € fuera de la web** (Bizum o transferencia). El cliente **debe subir el comprobante** para enviar la reserva.
- Ciclo de vida: `pendiente` → `aceptada` | `rechazada`. Una reserva rechazada **libera el hueco**.
- Duración por paquete (P1 = 30 min, P2 = 30 min, P3 = 45 min), **+15 min** con la ampliación bebé (+20 €), **15 min** de margen entre sesiones, pasos de 15 min y **2 h** de antelación mínima.
- Preventa del 11 al 16 de octubre de 2026 con un 10 % de descuento; después, precio normal.
- UI en **español (España)**, EUR con formato `76,50 €`, zona horaria **Europe/Madrid**.

## Comandos
```bash
npm run dev                      # Vite en local (necesita .env.local)
npm run build                    # tsc -b && vite build → dist/
npm run preview                  # sirve dist/
npm test                         # vitest run (jsdom)
npx vitest run src/lib/slots.test.ts      # un solo archivo
npx vitest run -t "nombre del test"       # un solo test por nombre
npm run lint                     # oxlint (no ESLint)
npm run format                   # prettier --write .
npm run images                   # regenera public/img y src/content/images.generated.ts
npm run purge:receipts           # borra comprobantes > 6 meses (ver README; --yes para borrar de verdad)
npm run seed:carousel            # sube images/Gallery/ al carrusel (ver README; --yes para subir de verdad)
npm run db:start | db:stop       # Supabase local en Docker (aplica supabase/migrations)
npm run db:types                 # regenera src/lib/database.types.ts desde la BD local
```
Antes de dar algo por terminado: `npm run lint && npm test && npm run build`.

## Stack
Vite 8 + React 19 + TypeScript (strict) + Tailwind CSS v4 (`@tailwindcss/vite`, tokens en `@theme` de `src/index.css`) + `react-router-dom` 7. Formularios con `react-hook-form` + `zod` 4. Fechas con `date-fns` + `@date-fns/tz`. Backend Supabase (Postgres, Auth, Storage, región UE) sin servidor propio. Tests con Vitest + Testing Library. Alias `@/` → `src/`.

## Arquitectura

### El servidor manda; el frontend replica para mostrar
La lógica crítica vive en **funciones SQL (RPC)** y **RLS** en [supabase/migrations/](supabase/migrations/). El frontend repite parte de esa lógica **solo para la UX**:
- [src/lib/slots.ts](src/lib/slots.ts) calcula las horas de inicio válidas replicando las reglas de `create_booking`.
- [src/lib/pricing.ts](src/lib/pricing.ts) calcula precios para mostrar; el importe real lo fija `create_booking`.
- `create_booking` valida paquete, duración, precio, franja, antelación, solapes, existencia y no reutilización del comprobante y consentimiento. Los solapes se impiden además con una **restricción de exclusión** (`bookings_no_overlap`, `tstzrange(starts_at, blocked_until)` donde `status <> 'rechazada'`).

**Datos duplicados que deben mantenerse sincronizados**: precios y duraciones están en [src/content/packages.ts](src/content/packages.ts) **y** en la tabla `public.packages`; preventa, adelanto, ampliación bebé, margen, paso y antelación están en [src/content/site.ts](src/content/site.ts) (`PRESALE`, `BOOKING`) **y** en las funciones SQL `cfg_*` (`0001_init.sql`). Cambiar uno implica una nueva migración para el otro (ver README, "Cambiar precios").

### RPCs y permisos
- Públicas (`anon`): `get_availability` (máx. 62 días por llamada; `src/lib/api.ts` la trocea), `create_booking`, `get_public_profile`, `get_site_images`.
- Admin (`authenticated` + `is_admin()`): `review_booking`, `save_availability_rule`, `delete_availability_rule`, `reorder_carousel`, y lectura/escritura de tablas vía RLS (salvo `availability_rules` y `availability_windows`, que solo se escriben por RPC).
- `anon` **nunca** lee `bookings`, `profile`, `site_images` ni el bucket `receipts`; solo hace INSERT en `receipts` y lee por URL pública los buckets `avatars` y `site-images`.
- El admin se comprueba con `is_admin()` (tabla `admins`), no con "usuario autenticado". Registros públicos desactivados en Supabase Auth.
- Solo la URL de Supabase y la publishable/anon key van al frontend; la `service_role` solo se usa en `scripts/purge-receipts.mjs` pasada por la terminal.

### Disponibilidad
`availability_windows` es lo único que consultan `get_availability` y `create_booking` (franjas no solapadas por exclusión; un trigger impide borrar franjas con reservas activas). Es una tabla **derivada**: el admin crea rangos en `availability_rules` (`disponible` | `no_disponible`; repetición `unico`, `mes` = ese día de la semana en todo su mes, o `hasta` = desde el día 1 de su mes hasta `until_day`) y `save_availability_rule` / `delete_availability_rule` llaman a `rebuild_availability`, que recalcula las franjas de los días afectados desde hoy (disponible − no disponible con multirangos, sin tramos más cortos que el paquete más corto) y falla con `BOOKINGS_OUTSIDE_WINDOWS` si alguna reserva activa queda fuera (`0006_availability_rules.sql`). [src/lib/availability.ts](src/lib/availability.ts) replica esa lógica para la vista previa del panel (días afectados, días que desaparecen de una serie y reservas en conflicto). UI en `src/components/admin/availability/`.

### Errores
Las RPC hacen `raise exception 'CODIGO'` (`SLOT_TAKEN`, `OUT_OF_WINDOW`, `PAST_TIME`, `RECEIPT_REUSED`…). [src/lib/errors.ts](src/lib/errors.ts) reconoce cualquier mensaje `^[A-Z_]+$` como código y lo traduce; las validaciones del cliente lanzan `AppError('CODIGO')`. Un código nuevo en SQL necesita su mensaje en `MESSAGES`.

### Capas del frontend
- [src/App.tsx](src/App.tsx): rutas públicas (`/`, `/reservar`, `/privacidad`, `/aviso-legal`) bajo `Layout`, y `/admin/*` bajo `AdminRoot` → `AdminGuard` → `AdminLayout`. Reserva y admin se cargan con `lazy` para que la home no cargue el cliente de Supabase.
- Por la misma razón, [src/lib/publicProfile.ts](src/lib/publicProfile.ts) lee el perfil con `fetch` directo a PostgREST (cacheado, con `DEFAULT_PROFILE` como respaldo) en vez de usar `supabase-js`. Tras guardar el perfil en el admin hay que llamar a `invalidatePublicProfile()`. Igual con las imágenes: [src/lib/publicSiteImages.ts](src/lib/publicSiteImages.ts) (`get_site_images`) e `invalidatePublicSiteImages()`. `SiteImage` pinta la foto subida o, si no hay, la del código (`FIXED_SECTIONS` en `src/lib/siteImages.ts`).
- `src/lib/api.ts`: llamadas de la reserva pública (disponibilidad, subida y compresión del comprobante, `create_booking`). `src/lib/adminApi.ts`: todas las llamadas del panel. `src/lib/auth.tsx`: sesión de Supabase y estado de admin.
- `src/lib/*` sin Supabase (`slots`, `pricing`, `admin`, `availability`, `calendar`, `dashboard`, `bookingSearch`, `profile`, `money`, `dates`) es lógica pura y es lo que cubren los tests unitarios. Hay también tests de componentes (`DayTimeline`, `MonthCalendar`, `Booking`, `AdminAvailability`, `App`); `src/test/setup.ts` bloquea `fetch` en los tests.
- La reserva pública es un asistente por pasos en `src/components/booking/` (`StepPackage` → `StepDateTime` → `StepClient` → `StepPayment` → `StepDone`) que comparten estado vía `stepContext.ts`.
- [src/lib/database.types.ts](src/lib/database.types.ts) se genera con `npm run db:types`; no editarlo a mano. Tras una migración nueva, regenerarlo.

### Imágenes y build
- `scripts/build-images.mjs` recorta páginas del PDF (extraídas con `scripts/extract-pdf-pages.mjs` a `assets-src/`, no versionado) y fotos de `images/`, y genera WebP en `public/img/` + `src/content/images.generated.ts` (rutas y dimensiones para `srcset`). `public/img/` **sí** se versiona: Cloudflare no ejecuta `npm run images`.
- El plugin `seo` de [vite.config.ts](vite.config.ts) genera `robots.txt` siempre y, si hay `VITE_SITE_URL`, `sitemap.xml` y URLs absolutas en `og:image`.

### Despliegue
Cloudflare Workers con static assets ([wrangler.toml](wrangler.toml), `not_found_handling = "single-page-application"`). **No** usar `public/_redirects` (Workers lo rechaza). Las `VITE_*` son variables de **build**. Push a `main` despliega producción; push a `develop` publica una preview (ambiente de desarrollo) contra un segundo proyecto Supabase: [scripts/build.mjs](scripts/build.mjs) sustituye las `VITE_*` por `DEV_SUPABASE_URL`, `DEV_SUPABASE_ANON_KEY` y `DEV_SITE_URL` en cualquier rama distinta de `main` (`WORKERS_CI_BRANCH`) y activa `VITE_NOINDEX` (ver README). El keepalive ([.github/workflows/keepalive.yml](.github/workflows/keepalive.yml)) llama a `get_availability` cada 3 días para que Supabase Free no se pause.

## Convenciones
- Código (identificadores, nombres de archivo) en **inglés**; textos visibles y comentarios de negocio en **español**.
- Importes en **céntimos (int)** en BD y en lógica; se formatean solo al mostrar con `formatEUR` ([src/lib/money.ts](src/lib/money.ts)).
- Fechas en BD como `timestamptz` (UTC). En el frontend, siempre con los helpers de [src/lib/dates.ts](src/lib/dates.ts) (`toMadrid`, `dayKey`, `madridDateTime`…), nunca `new Date().getHours()` a pelo. Los cálculos de slots se hacen en milisegundos UTC para no romperse con el cambio de hora.
- Componentes funcionales, sin librerías de UI pesadas.
- Cambios de esquema: **siempre una migración nueva** numerada en `supabase/migrations/`, nunca editar las ya aplicadas.

## Entorno local (Windows)
- Node 24 (`.nvmrc`). **No hay Python ni poppler**: para procesar el PDF se usan scripts de Node (`zlib` + `sharp`).
- `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y, opcional, `VITE_SITE_URL` (ver `.env.example`).

## Datos pendientes de Mónica
- IBAN y concepto del pago (el Bizum lo rellena ella en `/admin/perfil`).
- Aviso legal y privacidad: el NIF está en `src/content/legal.ts`; nombre, email e Instagram salen del perfil (`/admin/perfil`).
- Lugar de las sesiones: ¿estudio o Espadilla? Dirección o punto de encuentro.
- Confirmar los valores por defecto: ampliación bebé +15 min, margen de 15 min entre sesiones y precio normal tras el 16 de octubre.
- Fotos originales en alta resolución del resto de imágenes (las del PDF son de 1055×1491 px con texto incrustado).
