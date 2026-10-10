# Fase 4 — Reserva pública (`/reservar`)

## Objetivo
Asistente de 5 pasos con el que el cliente elige paquete, fecha y hora (según la duración del paquete), deja sus datos, paga el adelanto fuera de la web, **sube el comprobante** y envía la reserva, que queda en estado `pendiente`.

## Prerrequisitos
Fases 2 (contenido y precios) y 3 (RPCs y bucket) completadas.

## Tareas

### 4.1 Lógica pura de horarios — `src/lib/slots.ts`
```ts
export interface Range { start: Date; end: Date }
export function getStartTimes(params: {
  windows: Range[];          // franjas publicadas
  busy: Range[];             // [starts_at, blocked_until) de reservas activas
  durationMin: number;       // paquete + ampliación bebé
  bufferMin: number;         // margen tras la sesión
  stepMin: number;           // 15
  now: Date;
  minLeadMin?: number;       // antelación mínima (120), igual que en create_booking
}): Date[]
```
Reglas (las mismas que en el servidor):
- Los candidatos son `w.start + k·step`.
- Un candidato es válido si:
  - `inicio + duración ≤ w.end`;
  - `[inicio, inicio + duración + margen)` no solapa ningún `busy`;
  - `inicio > now + minLead`.

Helper `groupByMadridDay(dates)` → `Map<'yyyy-MM-dd', Date[]>` para el calendario.

**Tests (`slots.test.ts`)**:
- Franja 10:00–12:00 con P3 (45 min) → 10:00, 10:15, … 11:15.
- Con una reserva ocupada [10:00, 11:00) y P1 (30 min) → 11:00, 11:15, 11:30. Y 9:30 no aparece porque está fuera de la franja.
- Ampliación bebé: P3 + 15 = 60 min en la franja 10:00–12:00 → la última hora es 11:00.
- Las horas pasadas o con menos de 2 h de antelación se excluyen.
- Cambio de hora (DST) el **25/10/2026**: una franja de 10:00–12:00 hora Madrid ese día produce horas correctas en hora local.
- Franjas y reservas vacías → `[]`.

### 4.2 Datos remotos — `src/lib/api.ts`
- `fetchAvailability(from, to)` → `supabase.rpc('get_availability', …)` y parseo a `Date`.
- `uploadReceipt(file)`:
  1. valida el tipo (jpeg/png/webp/pdf) y el tamaño (≤ 5 MB);
  2. **comprime en el cliente** las imágenes > 1,5 MB con un `canvas` a JPEG de 1600 px de lado máximo;
  3. nombre `crypto.randomUUID() + ext`;
  4. `storage.from('receipts').upload(name, file, { upsert: false, contentType })`;
  5. devuelve el `path`.
- `createBooking(input)` → `supabase.rpc('create_booking', …)` y devuelve el `id`.
- `src/lib/errors.ts`: mapa código → mensaje en español:
  - `SLOT_TAKEN`: "Ese horario acaba de reservarse. Elige otra hora; tu comprobante se mantiene."
  - `OUT_OF_WINDOW`: "Ese horario ya no está disponible."
  - `PAST_TIME`: "Las reservas deben hacerse con al menos 2 horas de antelación."
  - `RECEIPT_MISSING`: "No hemos podido verificar el comprobante. Vuelve a subirlo."
  - `RECEIPT_REUSED`: "Este comprobante ya se usó en otra reserva."
  - `TOO_MANY_PENDING`: "Ya tienes reservas pendientes de revisión. Escríbenos por Instagram."
  - `CONSENT_REQUIRED`: "Debes aceptar la política de privacidad."
  - otros: "Ha ocurrido un error. Inténtalo de nuevo."

### 4.3 Estado del asistente
- `useReducer` en `pages/Booking.tsx` con `{ step, packageCode, baby, startsAt, client, receiptPath, bookingId }`.
- El paquete inicial sale de `?paquete=P2`.
- Borrador en `sessionStorage` (con try/catch) para no perder datos al recargar. **No** se guarda el archivo, solo el `receiptPath` si ya se subió.
- Barra de progreso "Paso X de 5". Botones Atrás/Siguiente. Se valida cada paso antes de avanzar.

### 4.4 Paso 1 — Paquete
Tarjetas compactas de los 3 paquetes (radio), con precio vigente (`pricing.ts`) y duración.
Casilla **"Ampliación de tiempo para bebé (+20 €)"** con el texto de ayuda del PDF ("Las sesiones están recomendadas para niños a partir de 6 meses…").
Resumen: duración total y precio total.

### 4.5 Paso 2 — Fecha y hora
- `MonthCalendar` (componente propio, sin librería): navegación por meses, lunes como primer día y locale `es`.
  - Los días con al menos una hora válida se resaltan y son clicables; el resto aparece deshabilitado.
  - Se navega solo entre los meses con franjas (de octubre a diciembre de 2026).
- Al elegir un día, `TimeSlotList` muestra botones con las horas ("10:00", "10:15"…) y la hora de fin ("10:00 – 10:45").
- Al cambiar de paquete o de opción bebé, se recalculan las horas y, si la hora elegida deja de ser válida, se borra.
- Se recarga la disponibilidad al entrar al paso y cada 60 s mientras el usuario está en él.
- Estado vacío: "De momento no hay huecos disponibles. Síguenos en Instagram para enterarte de nuevas fechas."

### 4.6 Paso 3 — Datos
`react-hook-form` + `zod`:
- nombre (2–120);
- email;
- teléfono (`^\+?[0-9 ]{9,16}$`);
- participantes (obligatorio, "Nº de niños/adultos y edades");
- notas (opcional, ≤ 1000);
- casilla **"He leído y acepto la política de privacidad"** (obligatoria, enlace a `/privacidad` en otra pestaña).

Las mismas restricciones que los `check` de SQL.

### 4.7 Paso 4 — Pago del adelanto y comprobante
- Caja con instrucciones de `site.ts → PAYMENT`:
  - "Haz un Bizum de **20 €** al **XXX XXX XXX**" o "transferencia a **ES…**";
  - titular;
  - concepto "Navidad + tu nombre";
  - botón "Copiar".
- Resumen: paquete, fecha y hora, total, adelanto 20 € y "Resto (X €) en efectivo el día de la sesión".
- `ReceiptUpload`:
  - entrada de archivo (con `capture` desactivado: debe permitir elegir una captura de la galería);
  - vista previa (miniatura o icono de PDF);
  - estados "subiendo / subido / error" y opción "Cambiar archivo" (sube un archivo nuevo con un uuid nuevo).
- El botón **"Enviar reserva"** está deshabilitado hasta tener el `receiptPath`. Al pulsarlo se llama a `createBooking`:
  - si la respuesta es `SLOT_TAKEN`, se vuelve al paso 2 conservando el comprobante y se muestra el aviso;
  - en cualquier otro error, se queda en el paso 4 con el mensaje.
- Protección contra doble envío: deshabilitar el botón mientras se envía.
- Campo **honeypot** oculto (`website`): si viene relleno, no se envía nada.

### 4.8 Paso 5 — Confirmación
"¡Reserva recibida! Está **pendiente de comprobación**. Mónica revisará tu comprobante y te confirmará."
Debajo, el código de reserva `id.slice(0, 8).toUpperCase()` y el resumen completo.
Botón "Volver al inicio". Limpiar el borrador de `sessionStorage`.

## Archivos creados
`src/lib/{slots,api,errors}.ts`, `src/lib/slots.test.ts`, `src/pages/Booking.tsx`, `src/components/booking/{StepPackage,StepDateTime,StepClient,StepPayment,StepDone,MonthCalendar,TimeSlotList,ReceiptUpload,BookingSummary,Stepper}.tsx`.

## Criterios de aceptación
- Las horas mostradas coinciden siempre con lo que acepta `create_booking`.
- No se puede enviar sin comprobante ni sin consentimiento.
- Si dos personas reservan el mismo hueco, solo una lo consigue y la otra ve el aviso, vuelve al paso 2 y conserva el comprobante.
- Funciona en móvil (375 px): el calendario es usable con el pulgar y los botones de hora miden ≥ 44 px.
- `npm test` cubre `slots.ts` y `pricing.ts`.

## Verificación
1. `npm test`.
2. Con franjas creadas (SQL o fase 5) y `npm run dev`: reservar P3 de principio a fin. Después comprobar en Supabase:
   - la fila en `bookings` con `status = pendiente` y el precio correcto;
   - el archivo en `receipts`.
3. En otra ventana de incógnito, comprobar que ese hueco ya no aparece y que, con P1, las horas adyacentes respetan el margen.
4. Simular la carrera: abrir dos ventanas en el paso 4 con la misma hora y enviar ambas → la segunda muestra `SLOT_TAKEN`.
5. Subir un `.txt` o un archivo de 8 MB → se rechaza en el cliente.
