# Fase 1 — Setup del proyecto

## Objetivo
Dejar un esqueleto de SPA que compile y se pueda desplegar: Vite + React + TS + Tailwind + router + lint + tests, con la identidad visual (colores y tipografías) del PDF.

## Prerrequisitos
- Node 24 (instalado) y npm.
- Cuenta de GitHub (para la fase 7).

## Tareas

### 1.1 Repositorio
1. `git init`, rama `main`.
2. `.gitignore`: `node_modules/`, `dist/`, `.env*` (excepto `.env.example`), `*.local` y `.DS_Store`.
3. Decidir qué pasa con los binarios de origen: `paquetes_navidad_2026.pdf` (31 MB) **no se versiona** (añadirlo a `.gitignore`). `images/` sí, o moverla a `assets-src/`.

### 1.2 Scaffold
1. `npm create vite@latest . -- --template react-ts` (en la carpeta existente; no borrar el PDF ni `images/`).
2. Dependencias:
   - runtime: `react-router-dom`, `@supabase/supabase-js`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `@date-fns/tz`;
   - dev: `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `jsdom`, `sharp`, `prettier`.
3. `tsconfig`: `"strict": true` y alias `@/*` → `src/*` (también en `vite.config.ts`).
4. Scripts en `package.json`: `dev`, `build`, `preview`, `test` (`vitest run`), `lint` e `images` (este último se rellena en la fase 2).

### 1.3 Tailwind e identidad visual
Tokens en `src/index.css` con `@import "tailwindcss";` y `@theme`:

| Token | Valor | Uso |
|---|---|---|
| `--color-cream` | `#F5EDE1` | fondo principal |
| `--color-cream-dark` | `#EADBC8` | tarjetas y secciones alternas |
| `--color-gold` | `#8A6D3B` | títulos, iconos, bordes |
| `--color-gold-light` | `#C9A96E` | líneas decorativas |
| `--color-ink` | `#4A3B2A` | texto |
| `--color-xmas-red` | `#A8262B` | precio tachado y acentos |
| `--color-pine` | `#2F4A34` | acentos verdes |

Tipografías de Google Fonts (con `preconnect` en `index.html`):
- **Cinzel** o **Cormorant Garamond** para títulos en mayúsculas espaciadas ("PAQUETES DE", "ESPADILLA");
- **Great Vibes** para el script ("Navidad", "Adicional");
- **Montserrat** (300/400/600) para el texto con `letter-spacing` amplio, como en el PDF.

Ajustar los colores mirando el PDF; los valores de arriba son una primera aproximación.

### 1.4 Rutas y layout base
`src/App.tsx` con `createBrowserRouter`:
- `/` → `Home`
- `/reservar` → `Booking`
- `/privacidad`, `/aviso-legal`
- `/admin/login`
- `/admin/*` → `AdminGuard` + `AdminLayout` (`/admin`, `/admin/reservas/:id`, `/admin/disponibilidad`)
- `*` → 404 sencillo

Páginas como placeholders en esta fase. `Layout` público con header (logo de texto "MÓNICA ROBLES" y CTA "Reservar") y footer (Instagram, enlaces legales).
Admin con **lazy loading** (`React.lazy`) para no cargar su código en la web pública.

### 1.5 Calidad
- ESLint (config de Vite) y Prettier.
- `vitest.config` (o la sección `test` en `vite.config.ts`) con `environment: 'jsdom'`.
- Un test trivial que pase para validar el pipeline.

### 1.6 Archivos base
- `public/_redirects` con `/* /index.html 200`.
- `.env.example`:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
- `src/lib/supabase.ts`: `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`, que lanza un error claro si faltan las variables.
- `src/lib/dates.ts`: constante `TZ = 'Europe/Madrid'` y helpers `toMadrid(date)`, `formatDateLong(date)` ("sábado, 7 de noviembre") y `formatTime(date)` ("10:30"), con `es` de `date-fns/locale`.
- `src/lib/money.ts`: `formatEUR(cents)` → `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.

## Archivos creados
`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/{main.tsx,App.tsx,index.css}`, `src/lib/{supabase,dates,money}.ts`, `src/pages/*` (placeholders), `src/components/Layout.tsx`, `public/_redirects`, `.env.example`, `.gitignore`.

## Criterios de aceptación
- `npm run dev` muestra la home placeholder con las fuentes y colores aplicados.
- Navegar a `/reservar`, `/admin` y una ruta inexistente funciona.
- `npm run lint && npm test && npm run build` pasan sin errores.

## Verificación
```bash
npm run build && npm run preview   # abrir /reservar directamente y recargar
```
