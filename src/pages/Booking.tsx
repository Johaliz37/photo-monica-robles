import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useBlocker, useSearchParams } from 'react-router-dom'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { EMPTY_CLIENT, type ClientData } from '@/components/booking/clientSchema'
import StepClient from '@/components/booking/StepClient'
import StepDateTime from '@/components/booking/StepDateTime'
import StepDone from '@/components/booking/StepDone'
import StepPackage from '@/components/booking/StepPackage'
import StepPayment from '@/components/booking/StepPayment'
import { StepContext } from '@/components/booking/stepContext'
import Stepper from '@/components/booking/Stepper'
import { findPackage, type PackageCode } from '@/content/packages'
import { createBooking } from '@/lib/api'
import { errorCode, errorMessage } from '@/lib/errors'

type Step = 1 | 2 | 3 | 4 | 5

const TOTAL_STEPS = 5
const STEP_TITLES: Record<Step, string> = {
  1: 'Elige tu paquete',
  2: 'Fecha y hora',
  3: 'Tus datos',
  4: 'Adelanto y comprobante',
  5: '¡Reserva recibida!',
}

interface State {
  step: Step
  packageCode: PackageCode | null
  baby: boolean
  /** ISO (UTC) de la hora de inicio elegida. */
  startsAt: string | null
  client: ClientData | null
  receiptPath: string | null
  bookingId: string | null
  /** Aviso para el paso 2 (no se guarda en el borrador). */
  notice: string | null
}

type Action =
  | { type: 'package'; code: PackageCode }
  | { type: 'baby'; baby: boolean }
  | { type: 'startsAt'; startsAt: string | null }
  | { type: 'client'; client: ClientData; advance: boolean }
  | { type: 'receipt'; path: string | null }
  | { type: 'go'; step: Step }
  | { type: 'slotTaken'; notice: string }
  | { type: 'done'; id: string }

const INITIAL: State = {
  step: 1,
  packageCode: null,
  baby: false,
  startsAt: null,
  client: null,
  receiptPath: null,
  bookingId: null,
  notice: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'package':
      return { ...state, packageCode: action.code }
    case 'baby':
      return { ...state, baby: action.baby }
    case 'startsAt':
      return { ...state, startsAt: action.startsAt, notice: null }
    case 'client':
      return { ...state, client: action.client, step: action.advance ? 4 : 2 }
    case 'receipt':
      return { ...state, receiptPath: action.path }
    case 'go':
      return { ...state, step: action.step, notice: null }
    case 'slotTaken':
      // Vuelve a elegir hora conservando datos y comprobante
      return { ...state, step: 2, startsAt: null, notice: action.notice }
    case 'done':
      return { ...state, step: 5, bookingId: action.id }
  }
}

// ===== Borrador en sessionStorage (no se guarda el archivo, solo su ruta) =====

const DRAFT_KEY = 'reserva-navidad-2026'

type Draft = Pick<State, 'step' | 'packageCode' | 'baby' | 'startsAt' | 'client' | 'receiptPath'>

function loadDraft(): Partial<Draft> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {}
  } catch {
    return {}
  }
}

function saveDraft(state: State) {
  try {
    if (state.step === 5) {
      sessionStorage.removeItem(DRAFT_KEY)
      return
    }
    const { step, packageCode, baby, startsAt, client, receiptPath } = state
    const draft: Draft = { step, packageCode, baby, startsAt, client, receiptPath }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Sin sessionStorage (modo privado, cookies bloqueadas…): se sigue sin borrador
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // Sin sessionStorage no hay borrador que borrar
  }
}

function init(queryPackage: string | null): State {
  const draft = loadDraft()
  const state: State = {
    ...INITIAL,
    step: [1, 2, 3, 4].includes(draft.step as number) ? (draft.step as Step) : 1,
    packageCode: findPackage(draft.packageCode)?.code ?? null,
    baby: draft.baby === true,
    startsAt: typeof draft.startsAt === 'string' ? draft.startsAt : null,
    client:
      draft.client && typeof draft.client === 'object'
        ? { ...EMPTY_CLIENT, ...draft.client }
        : null,
    receiptPath: typeof draft.receiptPath === 'string' ? draft.receiptPath : null,
  }

  // ?paquete=P2 manda sobre el borrador
  const fromQuery = findPackage(queryPackage)?.code
  if (fromQuery && fromQuery !== state.packageCode) {
    state.packageCode = fromQuery
    state.startsAt = null
    state.step = 1
  }

  // No se puede estar en un paso sin haber completado los anteriores
  if (!state.packageCode) state.step = 1
  else if (state.step > 2 && !state.startsAt) state.step = 2
  else if (state.step > 3 && !state.client) state.step = 3
  return state
}

export default function Booking() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, dispatch] = useReducer(reducer, searchParams.get('paquete'), init)
  // Se fija al montar para que los precios no cambien mientras se reserva
  const [now] = useState(() => new Date())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  // El paquete de la URL ya está en el estado: se quita para que recargar no lo reimponga
  useEffect(() => {
    if (searchParams.has('paquete')) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => saveDraft(state), [state])

  // Salir de la reserva (navegar a otra página) la reinicia: volver a «Reservar» empieza de cero.
  // Recargar la página no desmonta el componente, así que el borrador sigue sirviendo para eso.
  useEffect(() => clearDraft, [])

  // Con la reserva a medias (pasos 2 a 4), salir a otra página pide confirmación
  const inProgress = state.step >= 2 && state.step <= 4
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      inProgress && currentLocation.pathname !== nextLocation.pathname,
  )

  // Al cambiar de paso: arriba del todo y foco en el título (lectores de pantalla)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [state.step])

  const go = useCallback((step: Step) => dispatch({ type: 'go', step }), [])
  const selectStart = useCallback(
    (startsAt: string | null) => dispatch({ type: 'startsAt', startsAt }),
    [],
  )
  const setReceipt = useCallback((path: string | null) => dispatch({ type: 'receipt', path }), [])

  const pkg = findPackage(state.packageCode)

  async function submit(): Promise<string | null> {
    const { client, startsAt, receiptPath } = state
    if (!pkg || !client || !startsAt || !receiptPath) return errorMessage(null)
    try {
      const id = await createBooking({
        packageCode: pkg.code,
        baby: state.baby,
        startsAt,
        name: client.name,
        email: client.email,
        phone: client.phone,
        participants: client.participants,
        notes: client.notes,
        receiptPath,
        privacyConsent: client.consent,
      })
      dispatch({ type: 'done', id })
      return null
    } catch (err) {
      const code = errorCode(err)
      if (code === 'SLOT_TAKEN') {
        dispatch({ type: 'slotTaken', notice: errorMessage(err) })
        return null
      }
      if (code === 'RECEIPT_MISSING' || code === 'RECEIPT_REUSED') setReceipt(null)
      return errorMessage(err)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center font-display text-2xl uppercase tracking-[0.25em] text-gold-dark sm:text-3xl">
        Reservar sesión
      </h1>
      <div className="mx-auto mt-4 mb-10 h-px w-24 bg-gold-light" />

      {/* Cada paso pinta su barra (progreso + Atrás/Siguiente) con StepNav; el 5 no tiene botones */}
      <StepContext.Provider
        value={{ step: state.step, total: TOTAL_STEPS, title: STEP_TITLES[state.step], headingRef }}
      >
        {state.step === 5 && (
          <div className="mb-6">
            <Stepper />
          </div>
        )}

        {state.step === 1 && (
          <StepPackage
            pkg={pkg}
            baby={state.baby}
            now={now}
            onPackage={(code) => dispatch({ type: 'package', code })}
            onBaby={(baby) => dispatch({ type: 'baby', baby })}
            onNext={() => go(2)}
          />
        )}

        {state.step === 2 && pkg && (
          <StepDateTime
            pkg={pkg}
            baby={state.baby}
            startsAt={state.startsAt}
            notice={state.notice}
            onSelect={selectStart}
            onBack={() => go(1)}
            onNext={() => go(3)}
          />
        )}

        {state.step === 3 && (
          <StepClient
            defaultValues={state.client ?? EMPTY_CLIENT}
            onSubmit={(client) => dispatch({ type: 'client', client, advance: true })}
            onBack={(client) => dispatch({ type: 'client', client, advance: false })}
          />
        )}

        {state.step === 4 && pkg && state.startsAt && state.client && (
          <StepPayment
            pkg={pkg}
            baby={state.baby}
            startsAt={state.startsAt}
            clientName={state.client.name}
            now={now}
            receiptPath={state.receiptPath}
            onReceipt={setReceipt}
            onBack={() => go(3)}
            onSubmit={submit}
          />
        )}

        {state.step === 5 && pkg && state.startsAt && state.bookingId && (
          <StepDone
            bookingId={state.bookingId}
            pkg={pkg}
            baby={state.baby}
            startsAt={state.startsAt}
            now={now}
          />
        )}
      </StepContext.Provider>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="¿Salir de la reserva?"
        confirmLabel="Salir"
        cancelLabel="Seguir reservando"
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        <p>Tu reserva todavía no se ha enviado y el hueco no queda guardado.</p>
        <p>Si sales, se perderán los datos introducidos y tendrás que empezar la reserva de nuevo.</p>
      </ConfirmDialog>
    </section>
  )
}
