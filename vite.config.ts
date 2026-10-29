/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Rutas públicas indexables (las de /admin quedan fuera). */
const PUBLIC_ROUTES = ['/', '/reservar', '/privacidad', '/aviso-legal']

/**
 * SEO dependiente del dominio. Con VITE_SITE_URL (p. ej. https://xxx.pages.dev):
 * - convierte en absolutas las URLs de imagen de index.html (WhatsApp y Facebook no aceptan relativas);
 * - genera sitemap.xml y enlaza el sitemap desde robots.txt.
 * Sin ella, solo se genera robots.txt.
 * Con noindex (ambiente de desarrollo), robots.txt lo bloquea todo y no hay sitemap.xml.
 */
function seo(siteUrl: string, noindex: boolean): Plugin {
  return {
    name: 'seo',
    apply: 'build',
    transformIndexHtml(html) {
      if (!siteUrl) return html
      return html
        .replaceAll('content="/img/', `content="${siteUrl}/img/`)
        .replace('"image": "/img/', `"url": "${siteUrl}/",\n        "image": "${siteUrl}/img/`)
    },
    generateBundle() {
      if (!siteUrl) {
        this.warn('VITE_SITE_URL no está definida: sin sitemap.xml ni URLs absolutas en og:image')
      }
      const robots = ['User-agent: *', noindex ? 'Disallow: /' : 'Disallow: /admin', '']
      if (siteUrl && !noindex) robots.push(`Sitemap: ${siteUrl}/sitemap.xml`, '')
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') })

      if (siteUrl && !noindex) {
        const urls = PUBLIC_ROUTES.map((r) => `  <url><loc>${siteUrl}${r}</loc></url>`).join('\n')
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/+$/, '')
  return {
    plugins: [react(), tailwindcss(), seo(siteUrl, env.VITE_NOINDEX === '1')],
    // En Docker sobre Windows los cambios del bind mount solo se detectan por polling
    server: { watch: { usePolling: process.env.VITE_USE_POLLING === 'true' } },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
