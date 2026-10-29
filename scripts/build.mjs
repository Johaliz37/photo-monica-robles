// Build para Cloudflare Workers Builds (lo llama `[build]` de wrangler.toml).
// Las variables de build del Worker son las mismas para todas las ramas, así que en cualquier
// rama que no sea `main` (ambiente de desarrollo) se sustituyen las VITE_* por las DEV_*:
// la preview apunta al Supabase de desarrollo y no se indexa. En local no cambia nada.
import { spawnSync } from 'node:child_process'

const branch = process.env.WORKERS_CI_BRANCH
const env = { ...process.env }

if (branch && branch !== 'main') {
  const map = {
    VITE_SUPABASE_URL: 'DEV_SUPABASE_URL',
    VITE_SUPABASE_ANON_KEY: 'DEV_SUPABASE_ANON_KEY',
    VITE_SITE_URL: 'DEV_SITE_URL',
  }
  const missing = Object.values(map).filter((name) => !env[name])
  if (missing.length) {
    // Nunca publicar una preview contra el Supabase de producción
    console.error(`Rama "${branch}": faltan las variables de build ${missing.join(', ')}`)
    process.exit(1)
  }
  for (const [target, source] of Object.entries(map)) env[target] = env[source]
  env.VITE_NOINDEX = '1'
  console.log(`Rama "${branch}": build de desarrollo contra ${env.VITE_SUPABASE_URL}`)
}

const { status } = spawnSync('npm', ['run', 'build'], { env, stdio: 'inherit', shell: true })
process.exit(status ?? 1)
