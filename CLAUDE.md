# CLAUDE.md — Mónica Robles Fotografía · Navidad 2026

## Regla 1
Lenguaje: Español.

## Qué es este proyecto
SPA para vender los **paquetes de sesión de fotos de Navidad 2026** de Mónica Robles (@monicarobles_fotografia) y gestionar **reservas** de sesiones.
MVP con una sola parte transaccional: **la reserva**. Todo lo demás (fotos, textos, paquetes, precios) es **estático y vive en el código**.

Fuente de verdad del contenido: [paquetes_navidad_2026.pdf](paquetes_navidad_2026.pdf) (9 páginas rasterizadas, sin texto extraíble) y [images/](images/).

## Reglas de producto (no negociables en el MVP)
- **Sin CMS ni opciones configurables** por la UI. Para cambiar paquetes o textos se edita `src/content/*.ts` y se redepliega.
- **Coste 0 €**: solo planes gratuitos (Cloudflare Workers, Supabase Free, GitHub Actions). No añadir servicios de pago.
- **Sin notificaciones** (ni email ni WhatsApp). Mónica entra en `/admin` para ver las reservas nuevas.
- **Pago del adelanto (20 €) fuera de la web** (Bizum o transferencia). El cliente **debe subir el comprobante** para enviar la reserva.
- Ciclo de vida de una reserva: `pendiente` → `aceptada` | `rechazada`. Una reserva rechazada **libera el hueco**.
- La duración de la reserva **depende del paquete** (P1 = 30 min, P2 = 30 min, P3 = 45 min), con **+15 min** si se marca la ampliación para bebé (+20 €). Hay un margen de 15 min entre sesiones.
- Preventa del 11 al 16 de octubre de 2026 con un 10 % de descuento. Pasado ese plazo se aplica el precio normal.
- UI **en español (España)**, moneda en EUR con formato `76,50 €`, zona horaria **Europe/Madrid**.

## Stack
- **Frontend**: Vite + React + TypeScript (strict) + Tailwind CSS v4 (`@tailwindcss/vite`) + `react-router-dom`.
- **Formularios**: `react-hook-form` + `zod` (`@hookform/resolvers`).
- **Fechas**: `date-fns` + `@date-fns/tz` (`TZDate`, siempre en `Europe/Madrid`).
- **Backend**: Supabase (Postgres, Auth, Storage), región UE. No hay servidor propio: la lógica crítica vive en **funciones SQL (RPC)** y en **RLS**.
- **Tests**: Vitest (unitarios de la lógica pura).
- **Hosting**: Cloudflare Workers con static assets (`wrangler.toml`, `not_found_handling = "single-page-application"`). No usar `public/_redirects` para el fallback SPA: Workers lo rechaza.
- **Keepalive**: GitHub Actions con un cron semanal (el plan Free de Supabase se pausa tras 7 días sin actividad).

## Reglas de seguridad
- El rol `anon` **nunca** lee `bookings` ni el bucket `receipts`. Solo puede:
  - llamar a `get_availability` y `create_booking`;
  - subir archivos (INSERT) a `receipts`.
- **El servidor es la fuente de verdad**: duración, precio, validación de franja, solapes y existencia del comprobante se calculan y validan en `create_booking`. El frontend solo hace cálculos para **mostrar** (UX).
- Los solapes se evitan con una **restricción de exclusión** en Postgres. No te fíes solo de validaciones previas.
- El acceso de admin se comprueba con `is_admin()` (tabla `admins`), no con un simple "usuario autenticado". Los registros públicos están desactivados en Supabase Auth.
- Nunca subas `.env` al repo. Solo la URL de Supabase y la **publishable/anon key** van al frontend; la `service_role` key jamás.

## Estructura
```
wrangler.toml                Worker de static assets (SPA fallback)
public/img/                  imágenes WebP optimizadas (generadas en la fase 2)
scripts/                     utilidades de build (extracción y optimización de imágenes)
src/content/                 datos estáticos: packages.ts, site.ts
src/lib/                     supabase.ts, slots.ts, pricing.ts, dates.ts, errors.ts
src/pages/                   Home, Booking, Privacy, Legal, admin/*
src/components/              UI reutilizable
supabase/migrations/         SQL versionado (tablas, RLS, RPCs, bucket, seed)
.github/workflows/           keepalive.yml
docs/fases/                  plan detallado por fase
```

## Comandos
```bash
npm install
npm run dev          # servidor local de Vite
npm run build        # tsc -b && vite build → dist/
npm run preview      # sirve dist/
npm test             # vitest run
npm run lint         # eslint
npm run images       # regenera public/img desde el PDF e images/ (fase 2)
npm run purge:receipts  # borra comprobantes de más de 6 meses (ver README, retención)
npm run db:start     # Supabase local en Docker (aplica supabase/migrations)
npm run db:stop
npm run db:types     # regenera src/lib/database.types.ts desde la BD local
```

## Convenciones
- Código (identificadores, nombres de archivo) en **inglés**. Textos visibles y comentarios de negocio en **español**.
- Importes en **céntimos (int)** en BD y en lógica. Solo se formatean al mostrar (`formatEUR`).
- Fechas en BD como `timestamptz` (UTC). En el frontend se convierten siempre con helpers de `src/lib/dates.ts`, nunca con `new Date().getHours()` a pelo.
- Componentes funcionales, sin librerías de UI pesadas, con Tailwind y tokens de color definidos en `@theme`.
- Los errores de las RPC llegan con un código (`SLOT_TAKEN`, `OUT_OF_WINDOW`…) y se traducen a mensajes en `src/lib/errors.ts`.
- Antes de dar algo por terminado: `npm run lint && npm test && npm run build`.

## Entorno local (Windows)
- Hay Node 24. **No hay Python ni poppler**: para procesar el PDF usa scripts de Node (`zlib` + `sharp`), no `pdftoppm`.
- Variables en `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y, opcional, `VITE_SITE_URL` (ver `.env.example`).

## Plan por fases
1. [Setup](docs/fases/01-setup.md)
2. [Contenido estático y landing](docs/fases/02-contenido-estatico.md)
3. [Supabase: BD, seguridad y storage](docs/fases/03-supabase.md)
4. [Reserva pública](docs/fases/04-reserva-publica.md)
5. [Panel de administración](docs/fases/05-panel-admin.md)
6. [Legal y pulido](docs/fases/06-legal-y-pulido.md)
7. [Despliegue](docs/fases/07-despliegue.md)

## Datos pendientes de Mónica
- Número de Bizum y/o IBAN, y concepto del pago.
- Datos para el aviso legal: nombre, NIF y email de contacto.
- Lugar de las sesiones: ¿estudio o Espadilla? Dirección o punto de encuentro.
- Confirmar los valores por defecto: ampliación bebé +15 min, margen de 15 min entre sesiones y precio normal tras el 16 de octubre.
- Fotos originales en alta resolución (las del PDF son de 1055×1491 px con texto incrustado).
