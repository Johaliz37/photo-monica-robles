# Fase 5 — Panel de administración (`/admin`)

## Objetivo
Zona privada para Mónica donde:
- ve las reservas nuevas (sin notificaciones, entra ella);
- revisa los datos y el comprobante;
- **acepta o rechaza** cada reserva;
- publica o retira franjas de disponibilidad en el calendario.

## Prerrequisitos
Fase 3 (Auth, `admins`, RLS, `review_booking`) y fase 4 (los componentes de calendario se reutilizan).

## Tareas

### 5.1 Autenticación
- `src/lib/auth.tsx`: `AuthProvider` con `supabase.auth.getSession()` y `onAuthStateChange`. Expone `{ session, isAdmin, loading, signIn, signOut }`.
  - `isAdmin` se obtiene con `supabase.rpc('is_admin')` o con un `select` en `admins` (política `admins_self`).
- `pages/admin/Login.tsx`: email y contraseña con `signInWithPassword`, mensaje de error genérico ("Credenciales incorrectas") y redirección a `/admin` o a la ruta `?next=`.
- `AdminGuard`:
  - mientras carga → spinner;
  - sin sesión → `/admin/login?next=…`;
  - con sesión pero sin ser admin → mensaje y botón "Cerrar sesión".
- `AdminLayout`:
  - menú "Reservas" (con contador de **pendientes**), "Disponibilidad" y "Cerrar sesión";
  - `<meta name="robots" content="noindex">` para todo `/admin`.
- Recuperar contraseña: no está en el MVP. Se resetea desde el dashboard de Supabase (documentarlo en el README).

### 5.2 Lista de reservas — `/admin`
- Pestañas/filtro: **Pendientes** (por defecto), Aceptadas, Rechazadas y Todas.
- Opción "Mostrar pasadas" (por defecto solo `starts_at >= hoy`).
- Tabla en escritorio y tarjetas en móvil, con estas columnas:
  - fecha y hora de la sesión;
  - paquete (+ icono si hay bebé);
  - cliente;
  - teléfono (enlace `tel:`);
  - total;
  - estado (badge de color);
  - fecha de recepción.
- Orden: pendientes por `created_at` ascendente (las más antiguas primero) y el resto por `starts_at`.
- Botón "Actualizar" y recarga automática al volver a la pestaña (`visibilitychange`).
- Contador de pendientes en la cabecera: `select('id', { count: 'exact', head: true }).eq('status','pendiente')`.

### 5.3 Detalle — `/admin/reservas/:id`
- Datos completos:
  - código corto;
  - paquete y duración;
  - inicio y fin;
  - total, adelanto (20 €) y resto a cobrar en efectivo;
  - nombre, email (`mailto:`), teléfono (`tel:` y enlace `https://wa.me/34…`, que lo abre ella a mano, no es una notificación);
  - participantes y notas;
  - fecha de consentimiento y de recepción.
- **Comprobante**: `storage.from('receipts').createSignedUrl(path, 300)`.
  - imagen → `<img>` ampliable;
  - PDF → `<iframe>`/`<object>` con el enlace "Abrir en pestaña nueva".
- Acciones según el estado:
  - `pendiente` → **Aceptar** y **Rechazar**;
  - `aceptada` → **Cancelar (rechazar)**;
  - `rechazada` → sin acciones.

  Las dos piden confirmación en un modal con "Nota interna (opcional)". Llaman a `rpc('review_booking', { p_id, p_status, p_note })`.
- Tras la acción: toast "Reserva aceptada/rechazada" y vuelta a la lista.

### 5.4 Disponibilidad — `/admin/disponibilidad`
- **Vista agenda** por semana o mes. Para cada día:
  - franjas (hh:mm–hh:mm);
  - dentro de cada franja, las reservas activas (hora, paquete y cliente, coloreadas por estado), con enlace al detalle.
- **Crear franjas** (formulario):
  - fecha o **varias fechas** (multiselección en `MonthCalendar`);
  - hora de inicio y hora de fin (select cada 15 min);
  - vista previa "Se crearán N franjas";
  - envío con un `insert` de un array.

  Las horas se convierten de Madrid a UTC con `@date-fns/tz` (`TZDate`). Si una franja se solapa con otra existente, la restricción de exclusión lo impide y se muestra "Se solapa con una franja existente".
- **Borrar franja**: botón en cada franja con confirmación. Si el trigger devuelve `WINDOW_HAS_BOOKINGS` → "No se puede borrar: tiene reservas activas. Recházalas primero."
- Indicador de **ocupación** por franja: minutos reservados respecto a minutos totales.

### 5.5 Detalles técnicos
- Todas las consultas admin usan la sesión autenticada. RLS (`is_admin()`) es la barrera real; el guard es solo UX.
- Tiempos siempre mostrados en Europe/Madrid.
- El código admin va en un *chunk* aparte (`React.lazy`) y no se carga en la parte pública.

## Archivos creados
`src/lib/auth.tsx`, `src/lib/adminApi.ts`, `src/components/admin/{AdminGuard,AdminLayout,BookingTable,BookingCard,StatusBadge,ReceiptViewer,ConfirmDialog,WindowForm,AgendaView}.tsx`, `src/pages/admin/{Login,Bookings,BookingDetail,Availability}.tsx`.

## Criterios de aceptación
- Sin sesión, cualquier ruta `/admin/*` redirige al login.
- Un usuario autenticado que no es admin no ve datos (RLS devuelve vacío).
- Mónica puede, desde el móvil:
  - crear franjas para varios días a la vez;
  - ver una reserva nueva con su comprobante;
  - aceptarla o rechazarla.
- Rechazar una reserva libera el hueco en `/reservar` de inmediato.
- No se puede borrar una franja con reservas activas.

## Verificación
1. Login con un usuario incorrecto → error. Login con Mónica → lista.
2. Crear franjas para 3 sábados de 10:00 a 14:00. Comprobar en `/reservar` (incógnito) que aparecen.
3. Hacer una reserva desde `/reservar`. Comprobar que aparece en Pendientes (contador +1) y que el comprobante se ve en el detalle.
4. Aceptarla y comprobar el cambio de estado. Hacer otra, rechazarla y verificar que su hueco vuelve a estar libre en `/reservar`.
5. Intentar borrar una franja con una reserva aceptada → mensaje de bloqueo.
6. Cerrar sesión y volver atrás con el navegador → redirige al login.
