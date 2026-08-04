# Cambios al CRM y correos — 30 jul 2026

**Repo:** `express-lyft/` — todo fusionado `pruebas` → `main`, ya en producción
(`booking.explyft.com`).

Resumen de todo lo que se tocó en esta sesión, en orden. Cada sección
incluye qué estaba mal/faltaba, qué se hizo, y cómo se verificó.

---

## 1. Los correos de reserva no mostraban el tax

**Problema:** Stripe sí cobraba el 7% de tax de Florida en el checkout, pero
tanto el correo de confirmación al cliente como el aviso al dueño solo
mostraban el monto base (sin tax) — no coincidía con lo que Stripe
realmente cobró.

**Causa:** el webhook ya calculaba el tax exacto (`sessionTaxAmount`) y lo
guardaba en `leads.tax_collected`, pero nunca se lo pasaba a los templates
de correo.

**Fix:**
- `emails/ConfirmationEmail.tsx`: ahora muestra Subtotal → Sales Tax (7%) →
  Total Charged / Total Deposit Charged.
- `app/api/webhooks/stripe/route.ts` y `app/api/confirm-payment/route.ts`:
  calculan el tax de la sesión y se lo pasan al template.
- `lib/resend.ts`: el aviso al dueño ahora incluye "Sales Tax Collected".

**Verificado:** renderizado del template con `@react-email/render` con un
depósito de $150 + 7% → mostró $150.00 → $10.50 → $160.50 correctamente.

---

## 2. Reservas manuales no llegaban al calendario

**Problema:** al agregar una reserva desde el CRM ("+ New Reservation") con
pago por Stripe (la opción por defecto — queda pendiente de pago), no se
creaba el evento en Google Calendar hasta que el huésped pagara online.

**Causa:** `app/api/leads/route.ts` solo creaba el evento si el status era
`paid`, `deposit_paid` o `hotel_b2b` — una reserva manual nueva entra como
`new`, fuera de esa lista.

**Fix:** cualquier reserva creada por el admin (`isAdmin`) genera el evento
de inmediato, sin importar el status — el CRM ya exige fecha/hora antes de
guardar, así que siempre hay algo real que agendar.

**Verificado:** en local contra la base real, confirmando que el evento se
crea al guardar sin pago previo.

---

## 3. Calendario del CRM: "+N más" no mostraba nada

**Problema:** el mini-calendario del tab Dispatch limitaba a 3 reservas por
día y el "+N more" era solo texto, no se podía ver el resto.

**Fix:** ahora es un botón que abre un modal con la lista completa de
reservas de ese día; cada una se puede abrir para ver el detalle completo.

**Verificado:** con datos reales del 30/07/2026 (4 reservas ese día,
incluyendo la que estaba oculta).

---

## 4. Filtros nuevos en Bookings y Sales Pipeline

Se agregaron a la tabla de **Bookings**:
- Rango de fechas (Desde/Hasta)
- Vehículo (Sedan & SUV, Suburban, Sprinter, Mini Bus, Coach Bus)
- Chofer asignado / sin asignar

Y a **Sales Pipeline** (y por extensión Quotes / Hotel Bookings, que
comparten el mismo header): el mismo filtro de rango de fechas.

**Verificado:** contra datos reales — "Unassigned" mostró 29 de 30
reservas, coincidiendo con el KPI del Command Center.

---

## 5. Calendario visual en todos los formularios

**Pedido:** reemplazar los campos `<input type="date">` de texto por el
mismo calendario visual (popover tipo mes) en todos lados.

**Hecho:** se extrajo un componente compartido
`components/CalendarPicker.tsx` (con `lib/dateUtils.ts` para el formateo y
la grilla de mes) con dos variantes:
- `CalendarDatePicker` — un solo día, para formularios.
- `CalendarRangeFilter` — rango, para los filtros de listas.

Reemplazado en: CRM (modales "Add Reservation" y "Edit Lead"), y el
formulario público de reserva (`components/BookingForm.tsx` y
`components/MainMapBookingForm.tsx`), respetando los mínimos de fecha (no
se puede reservar en el pasado, ni el regreso antes de la ida).

**Bug encontrado y arreglado en el camino:** el popover se salía de la
pantalla cuando el botón estaba cerca del borde derecho — se cambió la
alineación para que siempre quede visible.

**Verificado:** seleccioné fechas en los 4 lugares contra datos/UI reales,
sin dejar nada guardado de prueba.

---

## 6. Vuelo, sillas y equipaje no llegaban al calendario

**Problema reportado:** "en el calendario no sale toda la información,
vuelos, sillas".

**Causa raíz:** el modal "Add Reservation" del CRM **nunca tuvo campos**
para aerolínea, número de vuelo, tipo de encuentro, sillas para niños,
equipaje ni notas — solo el modal de "Edit Lead" los tenía. Cualquier
reserva creada manualmente guardaba esos campos vacíos, y por eso nunca
aparecían ni en Google Calendar ni en el CRM (el dato nunca se capturaba).

**Fix:**
- Se agregaron esos campos al modal "Add Reservation" (con el fee de $25
  de Meet & Greet auto-calculado al elegirlo).
- El tooltip de los chips del Dispatch Calendar y el modal de "+N más"
  ahora también muestran vuelo/sillas/equipaje cuando existen (antes los
  escondían aunque el dato sí existiera).

**Verificado:** payload del POST interceptado (sin crear nada real) y
confirmado con una reserva real (Jaymes Porpiglio → "✈ Allegiant 3473").

---

## 7. Correo de recordatorio 24 horas antes (nuevo)

**Pedido:** un correo automático que se activa 24h antes del pickup, con
el resumen de la reserva y las instrucciones de pickup (basadas en el
flyer "Guest Pickup Instructions").

**Hecho:**
- `emails/PickupReminderEmail.tsx` — nuevo template. Detecta automáticamente
  si el pickup es en aeropuerto, hotel o puerto de crucero (según el texto
  del lugar de recogida) y muestra solo el bloque de instrucciones
  correspondiente, no las tres juntas.
- `app/api/cron/trip-reminders/route.ts` — nuevo cron, corre cada hora,
  agarra reservas confirmadas entre 23-25h antes del pickup.
- `vercel.json` — cron registrado.
- Columna nueva `leads.trip_reminder_sent_at` (migración corrida
  manualmente en Supabase).

**Verificado:** renderizado de los 3 escenarios (aeropuerto/hotel/crucero)
confirmando que cada uno elige el bloque correcto.

---

## 8. Confirmación real de entrega del recordatorio

**Pedido:** poder saber si el correo de recordatorio realmente le llegó al
huésped, no solo que se intentó enviar.

**Hecho:**
- `app/api/webhooks/resend/route.ts` — nuevo endpoint que recibe eventos de
  Resend (firmados con Svix, mismo patrón que el webhook de Stripe) y
  actualiza el estado según lo que Resend reporta: `sent` → `delivered` →
  `opened` (o `bounced` / `failed` / `complained`).
- Columnas nuevas `trip_reminder_email_id`, `trip_reminder_status`,
  `trip_reminder_status_at` en `leads`.
- El detalle de cada reserva en el CRM ahora muestra un punto de color con
  el estado real ("● Delivered", "● Bounced — bad email address", etc).

**Configuración manual que quedó pendiente y ya se hizo:**
1. SQL de las 3 columnas nuevas, corrido en Supabase.
2. Webhook creado en el dashboard de Resend apuntando a
   `https://booking.explyft.com/api/webhooks/resend`, con el signing
   secret guardado como `RESEND_WEBHOOK_SECRET` en Vercel.

**Verificado end-to-end:** correo de prueba real enviado, el webhook
actualizó el estado solo a `delivered` sin intervención manual. Lead y
scripts de prueba borrados después.

---

## Cosas que quedaron pendientes (no pedidas, solo detectadas)

- Cuando el admin agrega una reserva ya pagada (externa/efectivo) desde el
  CRM, el dueño **no** recibe el aviso por correo de "nueva reserva
  pagada" — eso solo pasa hoy con pagos online (webhook de Stripe /
  confirm-payment). Si se quiere, es un cambio chico en
  `app/api/leads/route.ts`.
- El recordatorio de 24h solo cubre la salida (ida). Un viaje redondo no
  manda un segundo recordatorio para el regreso.

## Nota para la próxima conversación

Si se reporta que sigue faltando algo en el calendario o en los correos,
revisar primero **dónde se captura el dato** (¿el formulario que lo generó
tiene el campo?) antes de asumir que es un problema de visualización — el
patrón de hoy fue exactamente ese: el dato no existía porque el formulario
de "Add Reservation" nunca lo pedía.
