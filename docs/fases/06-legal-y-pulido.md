# Fase 6 — Legal, SEO y pulido

## Objetivo
Cumplir con el **RGPD/LOPDGDD** y la **LSSI** (España) al recoger datos personales. Además: SEO y Open Graph para compartir en Instagram y WhatsApp, accesibilidad y rendimiento.

## Prerrequisitos
Fases 2, 4 y 5 completadas. Datos legales de Mónica: nombre completo, NIF, email de contacto y, si procede, dirección.

## Tareas

### 6.1 Política de privacidad — `/privacidad`
Contenido estático en `src/content/legal.ts`. Debe incluir:
- **Responsable**: Mónica Robles (NIF, email).
- **Datos que se tratan**:
  - nombre, email, teléfono, participantes (pueden incluir **edades de menores**), notas;
  - comprobante de pago (puede contener datos bancarios parciales).
- **Finalidad**: gestionar la reserva de la sesión fotográfica y contactar para su organización.
- **Base legal**: ejecución de un precontrato o contrato a petición del interesado (art. 6.1.b RGPD) y consentimiento.
- **Conservación**: el tiempo necesario para la reserva y las obligaciones legales, con una propuesta de **12 meses** tras la sesión. Los comprobantes, 6 meses.
- **Destinatarios / encargados**: Supabase (alojamiento en la UE, Frankfurt) y Cloudflare (hosting web). Sin cesiones a terceros.
- **Derechos**: acceso, rectificación, supresión, oposición, limitación y portabilidad, por email. Derecho a reclamar ante la **AEPD**.
- **Menores**: los datos de menores los facilita su padre, madre o tutor.

### 6.2 Aviso legal — `/aviso-legal`
Titular, NIF, contacto, objeto de la web, propiedad intelectual de las fotografías ("todas las imágenes son propiedad de Mónica Robles") y legislación aplicable.

### 6.3 Cookies
La web **no usa cookies de seguimiento**. Supabase Auth solo guarda la sesión en `localStorage` en `/admin`, un uso técnico y necesario. **No se necesita banner de cookies** si no se añade analítica. Si se quisiera analítica, usar **Cloudflare Web Analytics** (gratis y sin cookies) y mencionarlo en la política.

### 6.4 Retención (tarea operativa)
- Documentar en el README una consulta SQL para purgar las reservas antiguas y sus comprobantes, que Mónica (o el desarrollador) ejecuta en enero de 2027:
  ```sql
  delete from storage.objects where bucket_id='receipts' and name in
    (select receipt_path from bookings where starts_at < now() - interval '6 months');
  ```
  Opcional: anonimizar las reservas de más de 12 meses.
- Opcional: botón en el admin "Borrar comprobante" en reservas ya cerradas.

### 6.5 SEO y compartir
- `index.html`:
  - `<html lang="es">`;
  - `<title>Sesiones de Navidad 2026 · Mónica Robles Fotografía</title>`;
  - `meta description`;
  - `og:title`, `og:description`, `og:image` (`/img/og-cover.jpg` 1200×630), `og:type=website`, `og:locale=es_ES`;
  - `twitter:card=summary_large_image`.
- Como es una SPA, las meta tags de `index.html` sirven para todas las rutas, y eso es suficiente para compartir la home y `/reservar`.
- `public/robots.txt` (`Disallow: /admin`) y `public/sitemap.xml` con `/`, `/reservar`, `/privacidad` y `/aviso-legal`.
- Favicon: una estrella ✦ dorada o el árbol del PDF en SVG, más `apple-touch-icon` 180×180.
- JSON-LD `LocalBusiness`/`ProfessionalService` (nombre, Instagram, zona Castellón/Vila-real) en `index.html`.

### 6.6 Accesibilidad y UX
- Navegación con teclado en todo el asistente y en el calendario (flechas y Enter).
- `aria-live` para errores y estados de subida.
- Contraste AA del texto dorado sobre crema (usar `--color-gold` oscuro para el texto pequeño).
- `prefers-reduced-motion` para las animaciones.
- Estados de carga (skeletons) en el calendario y en la lista admin.
- Página 404 con estilo y enlace a inicio.

### 6.7 Rendimiento
- Precarga de la imagen del hero (`<link rel="preload" as="image">`) y `loading="lazy"` en el resto.
- `font-display: swap` y solo los pesos usados.
- Bundle público sin código de admin (verificar con `vite build --report` o `rollup-plugin-visualizer`).

### 6.8 Revisión de contenidos
Repasar textos contra el PDF y unificar el formato de los precios: el PDF mezcla `76'50 €` y `130,50 €`; en la web siempre `76,50 €`.

## Archivos creados
`src/content/legal.ts`, `src/pages/{Privacy,Legal,NotFound}.tsx`, `public/{robots.txt,sitemap.xml,favicon.svg,apple-touch-icon.png}`, `public/img/og-cover.jpg` y metas en `index.html`.

## Criterios de aceptación
- La casilla de consentimiento del paso 3 enlaza a una política completa con datos reales de Mónica (sin "TODO").
- Lighthouse en móvil: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- Al compartir la URL en WhatsApp se ve la tarjeta con imagen y título.

## Verificación
- Lighthouse sobre `npm run preview`.
- https://www.opengraph.xyz o el depurador de Facebook con la URL desplegada (tras la fase 7).
- Recorrer el asistente solo con teclado.
