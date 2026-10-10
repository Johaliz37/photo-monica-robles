import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fuentes servidas desde la propia web (sin Google Fonts): solo el subconjunto latino y los pesos usados
import '@fontsource/cinzel/latin-400.css'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/great-vibes/latin-400.css'
import '@fontsource/montserrat/latin-300.css'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-600.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
