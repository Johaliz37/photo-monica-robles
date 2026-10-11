import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Sin `globals: true`, Testing Library no desmonta solo entre tests
afterEach(cleanup)

// Los tests no salen a la red: el perfil público cae en sus valores por defecto
vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fetch deshabilitado en los tests'))))
