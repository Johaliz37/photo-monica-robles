# Plan: SPA de reservas "Mónica Robles Fotografía – Navidad 2026"

## Contexto
Mónica Robles quiere una web SPA para vender sus **paquetes de Navidad 2026** (MVP). Todo el contenido (fotos, paquetes, precios, info) es **estático y va en el código**: sin CMS ni opciones configurables. Lo único transaccional son las **reservas de sesión** en los huecos que ella publique. El cliente paga 20 € por adelantado (Bizum/transferencia) y **sube el comprobante**. La reserva queda **pendiente** hasta que Mónica la revise en un panel privado y la **acepte o rechace**. No hay notificaciones: ella entra a la web para ver las reservas nuevas. Objetivo: **coste 0 €**.

La carpeta del proyecto está vacía salvo `paquetes_navidad_2026.pdf` (9 páginas, solo imágenes) e `images/` (7 JPG de WhatsApp que repiten páginas o fotos del PDF).

### Contenido extraído del PDF (fuente de los datos estáticos)
| Paquete | Precio normal | Preventa (−10 %) | Sesión | Incluye |
|---|---|---|---|---|
| 01 | 85 € | 76,50 € | 30 min | 5 fotos editadas (retoque piel básico + eliminación objetos/manchas), felicitación digital, 3 felicitaciones impresas 13x18, cajita + 5 fotos impresas 13x18 |
| 02 | 145 € | 130,50 € | 30 min | 10 fotos editadas (mismo retoque), felicitación digital, 10 fotos impresas 15x20, 6 imanes 6x6, 6 felicitaciones díptico 30x15, pegatinas |
| 03 | 195 € | 175,50 € | 45 min | 15 fotos editadas (mismo retoque), felicitación digital, álbum 20x20 de 5 hojas, 6 calendarios de faldilla 10x15, 3 felicitaciones díptico 30x15 |

- **Preventa**: del domingo 11 al viernes 16 de octubre, 10 % de descuento.
- **Adicionales** (se eligen tras la sesión, no en la reserva): foto extra 7 €; a partir de 10 extra, 6 €/foto; galería completa digital editada sin piel, 50 €.
- **Información adicional**: adelanto de 20 € para reservar y el resto en efectivo el día de la sesión. Pruebas por enlace en 24/48 h. Entrega digital en un máximo de 1 semana tras recibir la selección (+1 semana si es la galería completa). Sesiones recomendadas desde los 6 meses; **ampliación de tiempo para bebés: +20 €**.
- **Espadilla**: escapada en familia ("Un pueblo entre montañas", "Rincones con historia" (Ermita de San Roque), "Naturaleza y aire libre", "Vuestra sesión de Navidad").
- Página 5: "Calendario de faldilla" (galería). Instagram: **@monicarobles_fotografia**.

## Arquitectura (todo en planes gratuitos)
| Pieza | Servicio | Por qué |
|---|---|---|
| Frontend SPA | **Vite + React + TypeScript + Tailwind CSS** | Ligero, estático, despliegue gratis |
| Hosting | **Cloudflare Pages** (`*.pages.dev`) | Ancho de banda ilimitado gratis, HTTPS, deploy desde Git |
| BD + Auth + Archivos | **Supabase** (free, región UE Frankfurt) | Postgres con RLS, login de admin y Storage privado para los comprobantes (1 GB) |
| Mantener vivo Supabase | **GitHub Actions** (cron semanal) | El plan free se pausa tras 7 días sin actividad |

Librerías: `@supabase/supabase-js`, `react-router-dom`, `react-hook-form` + `zod`, `date-fns` + `date-fns-tz` (zona `Europe/Madrid`).
Dominio propio opcional (~10 €/año). No es necesario para el MVP.

## Modelo de datos (Supabase / Postgres)
Migración SQL en `supabase/migrations/0001_init.sql`:

- **`packages`** (semilla fija, no editable desde la UI): `code` ('P1','P2','P3'), `duration_min` (30/30/45), `price_cents`, `presale_price_cents`. El servidor la usa para calcular duración y precio, así el cliente no puede manipularlos.
- **`availability_windows`**: `id`, `starts_at timestamptz`, `ends_at timestamptz`, `created_at`. Son las franjas que publica Mónica (p. ej. "sáb 7 nov 10:00–14:00").
- **`bookings`**:
  - `id uuid`, `package_code`, `baby_extension bool`
  - `starts_at`, `ends_at` (inicio + duración del paquete + ampliación bebé), `blocked_until` (`ends_at` + margen entre sesiones)
  - `price_cents` (precio aplicado: preventa o normal), `deposit_cents` (2000)
  - `client_name`, `email`, `phone`, `participants` (texto: nº de niños y edades), `notes`
  - `receipt_path` (obligatorio), `status` ('pendiente' | 'aceptada' | 'rechazada'), `admin_note`, `reviewed_at`
  - `privacy_consent_at`, `created_at`
  - **Restricción de exclusión** `EXCLUDE USING gist (tstzrange(starts_at, blocked_until) WITH &&) WHERE (status <> 'rechazada')`: Postgres impide reservas solapadas de forma atómica. Una reserva rechazada libera el hueco.

Constantes en SQL: ampliación bebé = **+15 min y +20 €**, margen entre sesiones = **15 min**, paso de horarios = **15 min**, fin de preventa = `2026-10-16 23:59 Europe/Madrid`. Las cuatro se pueden cambiar en un solo sitio.

### Seguridad (RLS)
- El rol `anon` **no puede leer** `bookings` (datos personales) ni escribir directamente en ninguna tabla.
- RPC `get_availability(from, to)` (`security definer`): devuelve las franjas y **solo los rangos ocupados** (`starts_at`, `blocked_until`), sin datos de clientes.
- RPC `create_booking(...)` (`security definer`), que:
  1. valida los datos;
  2. calcula duración y precio desde `packages` (preventa según `now()`);
  3. comprueba que `[starts_at, blocked_until)` cabe dentro de una `availability_window` y que la hora es futura;
  4. comprueba que el `receipt_path` existe en `storage.objects`;
  5. limita a 3 reservas pendientes por email o teléfono (antispam básico);
  6. inserta y devuelve el `id`. Si hay solape, la restricción lanza un error y la UI muestra "Ese horario acaba de ocuparse, elige otro" (el comprobante subido se reutiliza).
- **Storage**: bucket privado `receipts`. `anon` solo puede hacer INSERT en `receipts/<uuid>.<ext>`, con tipos `image/jpeg|png|webp` y `application/pdf` de hasta 5 MB. No puede leer, listar ni sobrescribir.
- Admin: Supabase Auth con email y contraseña, **registros públicos desactivados** y una única usuaria creada a mano. Las políticas RLS dan acceso total a `authenticated` en `bookings`, `availability_windows` y lectura de `receipts` (con URL firmada para ver el comprobante).

## Cálculo de horarios disponibles (según paquete)
En el frontend, `src/lib/slots.ts` es una función pura y testeable:
`getStartTimes(windows, busyRanges, durationMin, bufferMin, stepMin)`.
Para cada franja recorre las horas de inicio cada 15 min. Una hora es válida si `inicio + duración ≤ fin de franja`, si `[inicio, inicio + duración + margen)` no solapa ningún rango ocupado y si es futura. La duración depende del paquete elegido y de la ampliación para bebé, así que al cambiar de paquete se recalculan los horarios. El servidor vuelve a validar todo en `create_booking`.

## Flujo del cliente (web pública)
Rutas:
- `/`: landing de una página con portada (preventa y −10 %), los 3 paquetes, galería (calendario de faldilla y fotos de estudio), Espadilla, adicionales, información adicional, CTA "Reservar" e Instagram.
- `/reservar`: asistente de 5 pasos:
  1. **Paquete** (+ casilla "Ampliación tiempo bebé +20 €"). Muestra precio y duración.
  2. **Fecha y hora**: calendario mensual con los días que tienen huecos marcados y, al elegir un día, la lista de horas de inicio válidas.
  3. **Datos**: nombre, email, teléfono, participantes y notas, más la casilla de **consentimiento RGPD** (obligatoria) con enlace a la política de privacidad.
  4. **Pago del adelanto**: instrucciones estáticas (Bizum a nº X / IBAN Y, concepto "Navidad + nombre"), importe 20 € y resumen (total, adelanto, resto en efectivo el día de la sesión). Subida obligatoria del comprobante (imagen o PDF, con vista previa). Sin comprobante no se puede continuar.
  5. **Confirmación**: "Reserva recibida, pendiente de comprobación", con el resumen y el código de reserva (los 8 primeros caracteres del uuid).
- `/privacidad` y `/aviso-legal`: páginas estáticas (obligatorias en España por el RGPD y la LSSI).

## Panel de administración (`/admin`, protegido)
- `/admin/login`: email y contraseña de Supabase.
- `/admin` (**Reservas**): lista con filtro por estado. Por defecto muestra "pendiente" y un contador de pendientes en la cabecera. Ordenada por fecha de sesión.
- `/admin/reservas/:id`: todos los datos, el comprobante (imagen o PDF mediante URL firmada) y los botones **Aceptar** y **Rechazar** (con nota opcional). Rechazar libera el hueco.
- `/admin/disponibilidad`:
  - calendario o lista de franjas con las reservas que contiene cada una;
  - formulario para crear franjas (fecha, hora de inicio y fin; opción de repetir en varios días seleccionados);
  - borrar una franja solo si no tiene reservas activas (validado en BD).
- Vista **Agenda** (dentro de disponibilidad): por día, las franjas con sus reservas aceptadas y pendientes.

## Estructura del proyecto
```
PhotoMonicaRobles/
├─ public/
│  ├─ _redirects                 # "/* /index.html 200" (SPA en Cloudflare Pages)
│  └─ img/                        # fotos optimizadas WebP (extraídas del PDF + images/)
├─ src/
│  ├─ content/
│  │  ├─ packages.ts             # 3 paquetes, precios, items, duración (estático)
│  │  ├─ site.ts                 # textos: preventa, adicionales, info, Espadilla, Bizum/IBAN, Instagram
│  ├─ lib/
│  │  ├─ supabase.ts             # cliente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│  │  ├─ slots.ts (+ slots.test.ts)
│  │  ├─ pricing.ts              # precio preventa/normal + bebé (solo para mostrar)
│  │  └─ dates.ts                # helpers Europe/Madrid
│  ├─ pages/  Home, Booking (wizard), Privacy, Legal, admin/{Login, Bookings, BookingDetail, Availability}
│  ├─ components/ PackageCard, MonthCalendar, TimeSlotList, ReceiptUpload, AdminGuard, Layout...
│  ├─ App.tsx, main.tsx, index.css
├─ supabase/migrations/0001_init.sql   # tablas, constraint, RLS, RPCs, bucket, seed packages
├─ .github/workflows/keepalive.yml     # cron semanal que llama a get_availability
├─ .env.example
└─ README.md                           # pasos de despliegue y alta de la admin
```

## Fases de desarrollo
1. **Setup**: `git init`, Vite React TS, Tailwind, router y lint. Paleta extraída del PDF (crema `#F5EDE1`, dorado `#8A6D3B`, rojo navidad `#A8262B`, verde abeto) y tipografías de Google Fonts parecidas (serif display tipo *Cormorant/Cinzel*, script tipo *Great Vibes*, sans tipo *Montserrat*).
2. **Contenido estático**: extraer e optimizar las imágenes del PDF y de `images/` a WebP (`public/img`), escribir `content/*.ts` y maquetar la landing responsive (móvil primero, ya que el tráfico llegará de Instagram y WhatsApp).
3. **Supabase**: crear el proyecto (UE), aplicar la migración, crear el bucket, desactivar los registros y crear la usuaria admin. Variables en `.env`.
4. **Reserva pública**: `slots.ts` con tests, el asistente de 5 pasos, la subida del comprobante y la llamada a `create_booking`, con manejo de errores (solape, archivo no válido, límite antispam).
5. **Panel admin**: login, guardas, lista y detalle con aceptar/rechazar, y gestión de franjas.
6. **Legal y pulido**: política de privacidad (qué datos se guardan, finalidad, conservación de p. ej. 12 meses y derechos ARCO), aviso legal, SEO básico (meta y Open Graph con la portada) y favicon.
7. **Despliegue**: repo en GitHub, Cloudflare Pages (build `npm run build`, salida `dist`, variables de entorno) y workflow keepalive.

## Verificación
- **Unit**: `npm test` (Vitest) sobre `slots.ts`. Casos: franja de 10:00–12:00 con P3 (45 min) y margen de 15 min, solapes con reservas existentes, horas pasadas, ampliación bebé y cambios de horario (DST, el 25 de octubre de 2026).
- **BD**: en el SQL editor de Supabase:
  - dos `create_booking` solapados → el segundo falla;
  - una reserva fuera de franja → falla;
  - sin comprobante → falla;
  - el rol anon no puede hacer `select` en `bookings` ni leer `receipts`.
- **E2E manual** con `npm run dev` y luego en la URL de `pages.dev`:
  1. crear franjas en `/admin/disponibilidad`;
  2. reservar como cliente en móvil (DevTools) subiendo un comprobante;
  3. comprobar que el hueco desaparece para otro paquete y navegador;
  4. en `/admin`, ver la reserva pendiente, abrir el comprobante y aceptarla;
  5. repetir con otra reserva, rechazarla y verificar que el hueco vuelve a estar libre;
  6. comprobar que `/admin` sin sesión redirige al login;
  7. recargar en `/reservar` (prueba de la redirección de la SPA).

## Datos que necesitaré de Mónica antes o durante la implementación
Número de Bizum y/o IBAN, y concepto del pago; datos para el aviso legal (nombre/NIF/email de contacto); dirección o punto de encuentro de la sesión (¿estudio o Espadilla?); y confirmar los valores por defecto: ampliación bebé +15 min, margen de 15 min entre sesiones y precio normal tras la preventa (16 oct).
