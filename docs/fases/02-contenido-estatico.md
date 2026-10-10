# Fase 2 — Contenido estático y landing

## Objetivo
Landing de una sola página, *mobile-first*, que reproduzca el catálogo del PDF: portada, 3 paquetes, galería, Espadilla, adicionales, información adicional y CTA a reservar. Todo el contenido está en `src/content/*.ts`.

## Prerrequisitos
Fase 1 completada.

## Tareas

### 2.1 Extracción y optimización de imágenes
El PDF tiene **9 páginas rasterizadas** (1055×1491 px, RGB, `ASCII85Decode + FlateDecode`) sin texto. No hay poppler ni Python en el equipo, así que se procesa con Node.

1. `scripts/extract-pdf-pages.mjs`: lee el PDF y localiza cada `/Subtype /Image`. Luego decodifica ASCII85, aplica `zlib.inflateSync` y pasa el RGB crudo a `sharp(raw, { raw: { width, height, channels: 3 } })`. Guarda `assets-src/pdf/p1..p9.png`, que no se versiona (está en `.gitignore`).
2. `scripts/build-images.mjs` (`npm run images`): con `sharp`, genera WebP en anchos **640 y 1280** (calidad ~80) en `public/img/`, a partir de:

| Origen | Salida | Uso |
|---|---|---|
| `p1` (portada, trineo) | `og-cover.jpg` (1200×630, recorte) | Open Graph |
| `images/…04.14.38` (cajita) | `pkg1.webp` | Paquete 01 |
| `images/…04.15.05` (kit) | `pkg2.webp` | Paquete 02 |
| `images/…04.15.42` (álbum) | `pkg3.webp` | Paquete 03 |
| `p5` (recortes de las 3 fotos) | `cal-1/2/3.webp` | Galería "Calendario de faldilla" |
| `images/…04.17.51` (bebé) | `studio-1.webp` | Galería y adicionales |
| `images/…04.18.19` (niña) | `studio-2.webp` | Galería y cierre |
| `p6` (recortes: pueblo, montañas, ermita, trineo) | `espadilla-*.webp` | Sección Espadilla |
| `p1` (recorte del trineo sin texto, zona inferior) | `hero.webp` | Fondo del hero |

   Los recortes se definen como coordenadas `{ left, top, width, height }` en el script, medidas sobre las páginas de 1055×1491.
3. Pedir a Mónica las **fotos originales en alta resolución**. Cuando las tengamos, solo hay que cambiar el origen en el script.

### 2.2 Datos estáticos
`src/content/packages.ts`:
```ts
export type PackageCode = 'P1' | 'P2' | 'P3';
export interface Package {
  code: PackageCode; number: '01' | '02' | '03';
  durationMin: number; priceCents: number; presalePriceCents: number;
  items: string[]; image: string; imageAlt: string;
}
export const PACKAGES: Package[] = [
  { code: 'P1', number: '01', durationMin: 30, priceCents: 8500, presalePriceCents: 7650,
    items: ['30 min. de sesión', '5 fotos editadas + retoque de piel básico + eliminación de objetos y manchas',
            'Felicitación digital', '3 felicitaciones impresas tamaño 13x18', 'Cajita + 5 fotografías impresas 13x18'], … },
  { code: 'P2', number: '02', durationMin: 30, priceCents: 14500, presalePriceCents: 13050,
    items: ['30 min. de sesión', '10 fotografías editadas + retoque de piel básico + eliminación de objetos y manchas',
            'Felicitación digital', '10 fotografías impresas 15 × 20 cm', '6 imanes 6 × 6 cm',
            '6 felicitaciones díptico 30 × 15 cm', 'Pegatinas'], … },
  { code: 'P3', number: '03', durationMin: 45, priceCents: 19500, presalePriceCents: 17550,
    items: ['45 min de sesión', '15 fotos editadas + retoque de piel básico + eliminación de objetos y manchas',
            'Felicitación digital', 'Álbum tamaño 20x20 con 5 hojas', '6 calendarios de faldilla 10x15',
            '3 felicitaciones díptico 30x15'], … },
];
```
`src/content/site.ts`:
- `PRESALE = { startsAt: '2026-10-11T00:00:00+02:00', endsAt: '2026-10-16T23:59:59+02:00', discountPct: 10 }`;
- `BOOKING = { depositCents: 2000, babyExtraCents: 2000, babyExtraMin: 15, bufferMin: 15, stepMin: 15 }`, que **debe coincidir** con las constantes SQL de la fase 3 (comentarlo en ambos sitios);
- `EXTRAS`: `[{ text: 'Podrás elegir fotos extra en la entrega de las fotos de prueba.', price: '7 €/foto' }, { text: 'A partir de 10 fotos extra.', price: '6 €/foto' }, { text: 'Galería completa digital editada sin piel.', price: '50 €' }]`;
- `INFO`: los 4 bloques de "Información adicional" (Forma de pago, Prueba de fotos, Tiempo de entrega archivos digitales, Sesiones con bebés) con el texto literal del PDF;
- `ESPADILLA`: título, subtítulo, introducción y las 4 tarjetas (texto literal de la página 6);
- `PAYMENT`: `{ bizum: 'TODO', iban: 'TODO', holder: 'TODO', conceptHint: 'Navidad + tu nombre' }`, pendiente de Mónica;
- `CONTACT`: `{ instagram: 'monicarobles_fotografia' }`.

`src/lib/pricing.ts`:
- `isPresale(now)`;
- `packagePrice(pkg, now)`, que devuelve `{ current, original?, discounted: boolean }`;
- `bookingTotal(pkg, baby, now)`.

Tests en `pricing.test.ts`: antes, durante y después de la preventa, y con la ampliación bebé.

### 2.3 Secciones de la landing (`src/pages/Home.tsx`)
Orden, con un componente por sección en `src/components/home/`:
1. **Hero**: fondo `hero.webp` con overlay crema, "PAQUETES DE" + "Navidad" (script), insignia circular "10 % de descuento" y "Preventa del domingo 11 al viernes 16 de octubre" (solo si `isPresale(now)` o antes de que empiece), CTA "Reservar mi sesión" y firma "MÓNICA ROBLES · 2026".
2. **Paquetes**: 3 `PackageCard` con número grande decorativo "01/02/03", precio tachado en rojo y precio de preventa, lista con iconos de destello ✦, imagen y botón "Reservar este paquete" → `/reservar?paquete=P2`.
3. **Galería**: "Calendario de faldilla" y fotos de estudio, en grid responsive y con `loading="lazy"`.
4. **Espadilla**: layout tipo collage como el PDF.
5. **Adicionales**: 3 filas con icono, texto y precio.
6. **Información adicional**: 4 bloques con separadores ✦.
7. **CTA final** e Instagram.

Detalles:
- Usar `<picture>`/`srcset` (640/1280), `alt` descriptivos y `width`/`height` para evitar saltos de layout (CLS).
- Separadores decorativos (línea + ✦) como componente `Divider`.
- Accesibilidad: contraste suficiente del texto dorado sobre crema (usar `gold` oscuro para el texto) y foco visible.

## Archivos creados
`scripts/extract-pdf-pages.mjs`, `scripts/build-images.mjs`, `public/img/*`, `src/content/{packages,site}.ts`, `src/lib/pricing.ts` (+ test), `src/components/{PackageCard,Divider,…}.tsx`, `src/components/home/*`, `src/pages/Home.tsx`.

## Criterios de aceptación
- Todo el texto del PDF aparece en la web sin erratas (revisarlo contra las páginas).
- Precios correctos según la fecha (mockear `now` en los tests).
- Lighthouse en móvil: Performance ≥ 85, Accessibility ≥ 90.
- Peso total de imágenes en la carga inicial < 1 MB.

## Verificación
- `npm test` (pricing).
- `npm run dev` y revisión a 375 px, 768 px y 1280 px.
- Lighthouse en Chrome DevTools sobre `npm run preview`.
