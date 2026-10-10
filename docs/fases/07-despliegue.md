# Fase 7 — Despliegue (coste 0 €)

## Objetivo
Publicar la SPA en **Cloudflare Pages** con despliegue automático desde GitHub, conectada a Supabase en producción. Programar un **keepalive** para que Supabase Free no se pause.

## Prerrequisitos
- Fases 1–6 completadas, con `npm run lint && npm test && npm run build` en verde.
- Cuentas gratuitas en GitHub y Cloudflare.
- Proyecto Supabase con la migración aplicada y la admin registrada (fase 3).

## Tareas

### 7.1 GitHub
1. Crear el repo **privado** `photo-monica-robles` y hacer push de `main`.
2. Comprobar que **no** se suben `.env.local`, `node_modules`, `dist` ni el PDF de 31 MB.
3. Secrets del repo (Settings → Secrets → Actions) para el keepalive: `SUPABASE_URL` y `SUPABASE_ANON_KEY`.

### 7.2 Cloudflare Pages
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → elegir el repo.
2. Configuración de build:
   - Framework preset: **Vite** (o ninguno);
   - Build command: `npm run build`;
   - Output directory: `dist`;
   - Variables de entorno (Production y Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL` (URL pública, para `og:image` y `sitemap.xml`; tras el primer deploy, poner la de `pages.dev` y redesplegar) y `NODE_VERSION=24` (o un `.nvmrc` con `24`).
3. Primer deploy → URL `https://<proyecto>.pages.dev`.
4. Verificar que `public/_redirects` (`/* /index.html 200`) permite recargar en `/reservar` y `/admin`.
5. Cada push a `main` despliega a producción. Las ramas generan *preview deploys* (útil para que Mónica revise los cambios antes).

Nota: si Cloudflare recomienda "Workers con static assets" en lugar de Pages, también es gratis. En ese caso hay que configurar `not_found_handling = "single-page-application"` en `wrangler.toml`.

**Decisión final (10/10/2026)**: se despliega como **Worker con static assets** ([wrangler.toml](../../wrangler.toml)). Se eliminó `public/_redirects`, porque Workers rechaza `/* /index.html 200` (error 100324, "Infinite loop detected"). Las `VITE_*` van en las variables de **build** del Worker. Ver el README.

### 7.3 Supabase en producción
- **Authentication → URL Configuration**: `Site URL` = la URL de `pages.dev` (o del dominio). Añadirla a `Redirect URLs`.
- Revisar que el **"Allow new users to sign up"** sigue desactivado.
- Database → **Backups**: el plan Free no tiene backups descargables automáticos. Documentar un export manual periódico (`Table editor → Export CSV` de `bookings`) o `pg_dump` con la CLI.
- Revisar el **Security Advisor** y el **Performance Advisor** del dashboard. Los avisos de RLS deben estar en verde.

### 7.4 Keepalive — `.github/workflows/keepalive.yml`
```yaml
name: supabase-keepalive
on:
  schedule: [{ cron: '0 8 */3 * *' }]   # cada 3 días
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/get_availability" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d "{\"p_from\":\"$(date -u +%FT%TZ)\",\"p_to\":\"$(date -u -d '+1 day' +%FT%TZ)\"}"
```
Nota: GitHub desactiva los crons programados en repos sin actividad durante 60 días. Para esta campaña (oct–dic) no es un problema.

### 7.5 Dominio (opcional, ~10 €/año)
Si Mónica quiere un dominio propio (p. ej. `monicaroblesfoto.es`):
1. Comprarlo (Cloudflare Registrar a precio de coste o cualquier registrador).
2. Pages → Custom domains → añadirlo (el certificado SSL se configura solo).
3. Actualizar el `Site URL` de Supabase y la variable `VITE_SITE_URL` de Pages (regenera `og:image` y `sitemap.xml`), y redesplegar.

### 7.6 README operativo (para Mónica y para el desarrollador)
- Cómo entrar al panel (`/admin`).
- Cómo publicar franjas y revisar reservas.
- Cómo resetear la contraseña desde el dashboard de Supabase.
- Cómo cambiar precios o textos: editar `src/content/*.ts` y las constantes SQL si afectan a precio o duración, después push.
- Purga de datos (consulta de la fase 6).
- Qué hacer si Supabase está pausado: dashboard → **Restore project**.

### 7.7 Calendario de la campaña
La preventa es del **11 al 16 de octubre de 2026** (hoy es 10/10/2026). Si no da tiempo a tener todo listo antes del 11:
- **Prioridad 1**: publicar ya la landing estática (fase 2) con un CTA a Instagram o WhatsApp, para que la preventa no dependa del sistema de reservas.
- **Prioridad 2**: activar `/reservar` en cuanto las fases 3–5 estén verificadas.
- Revisar `cfg_presale_*` y `PRESALE` en `site.ts` si Mónica amplía la preventa.

## Archivos creados
`.github/workflows/keepalive.yml`, `.nvmrc`, `README.md` (operativo).

## Criterios de aceptación
- La URL pública carga en menos de 2 s en 4G y las rutas profundas recargan bien.
- Recorrido E2E en producción:
  1. crear franjas en `/admin`;
  2. reservar desde el móvil con un comprobante;
  3. ver la reserva pendiente en `/admin`;
  4. aceptarla;
  5. rechazar otra y comprobar que su hueco se libera.
- El workflow keepalive se ejecuta manualmente (`workflow_dispatch`) con éxito.
- Coste mensual: **0 €** (sin contar el dominio opcional).

## Verificación final (checklist de producción)
- [ ] `anon` no puede leer `bookings` ni `receipts` (probado contra la URL de producción).
- [ ] Registro público en Supabase Auth desactivado.
- [ ] Política de privacidad y aviso legal con datos reales.
- [ ] Datos de Bizum o IBAN correctos en el paso 4.
- [ ] Precios correctos según la fecha (preventa o normal).
- [ ] Open Graph correcto al compartir en WhatsApp.
- [ ] Keepalive en verde.
