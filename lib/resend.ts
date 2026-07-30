import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Dirección donde el dueño recibe los avisos de nuevas reservas.
export const OWNER_EMAIL = process.env.OWNER_EMAIL || 'book@explyft.com';

// Remitente del aviso al dueño. IMPORTANTE: debe ser DISTINTO de OWNER_EMAIL.
// Si el remitente y el destinatario son iguales (p. ej. book@ -> book@),
// Google Workspace descarta el correo por "auto-envío"/spoofing. Por eso el
// aviso sale desde notifications@ aunque el correo del cliente use book@.
export const OWNER_NOTIFY_FROM = 'Express Lyft <notifications@explyft.com>';

// Notes/special requests are free text the guest typed in — escape before
// interpolating into HTML email templates so it can't break the markup or
// inject content.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Envía al dueño una alerta clara de "nueva reserva pagada".
 * Es un correo aparte (no un BCC del correo del cliente), redactado para el
 * dueño, con todos los datos de la reserva. Nunca lanza error: si algo falla,
 * solo lo registra en consola para no romper el flujo de pago.
 */
export async function sendOwnerNotification(
  lead: any,
  opts?: { isDeposit?: boolean; amountPaid?: number | null; totalAmount?: number | null }
) {
  if (!resend || !lead) return;

  try {
    const isDeposit = opts?.isDeposit ?? lead.payment_type === 'deposit';
    const paid = opts?.amountPaid ?? lead.amount_paid ?? lead.amount_usd;
    const total = opts?.totalAmount ?? lead.amount_usd;
    const remaining =
      lead.amount_remaining ?? (isDeposit && total && paid ? total - paid : null);

    const money = (v: any) =>
      v === null || v === undefined || v === '' ? null : `$${v}`;
    const vehicle = (lead.vehicle_type || '').replace(/_/g, ' ');

    const rows: Array<[string, any]> = [
      ['Customer', lead.customer_name],
      ['Phone', lead.customer_phone],
      ['Email', lead.customer_email],
      ['Pickup', lead.pickup],
      ['Destination', lead.destination],
      ['Date', lead.date],
      ['Time', lead.time],
      lead.trip_type === 'round-trip'
        ? ['Return', [lead.return_date, lead.return_time].filter(Boolean).join(' ')]
        : ['Trip type', lead.trip_type || 'One way'],
      ['Vehicle', vehicle],
      ['Passengers', lead.passengers],
      ['Luggage', lead.luggage_count],
      ['Car Seats', lead.car_seats_requested],
      ['Airline / Flight', [lead.airline, lead.flight_number].filter(Boolean).join(' ')],
      ['Meeting', lead.meeting_type],
      ['Payment', isDeposit ? 'Deposit' : 'Full payment'],
      ['Paid', money(paid)],
      isDeposit ? ['Balance due', money(remaining)] : ['', ''],
      // Notes go last, own row spanning both columns further down — this
      // placeholder just keeps it out of the two-column key/value table
      // since it can run long (e.g. "3 cold Cokes, allergic to peanuts").
    ];

    const rowsHtml = rows
      .filter(([label, value]) => label && value !== null && value !== undefined && value !== '')
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#888;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-weight:600;color:#111;">${value}</td></tr>`
      )
      .join('');

    const notesHtml = lead.notes
      ? `<div style="margin-top:16px;padding:12px;background:#f9f6ee;border:1px solid #eee0b8;border-radius:6px;">
           <p style="margin:0 0 4px;color:#888;font-size:13px;font-weight:600;">Special Requests / Notes</p>
           <p style="margin:0;color:#111;font-size:15px;white-space:pre-wrap;">${escapeHtml(String(lead.notes))}</p>
         </div>`
      : '';

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#111;margin:0 0 4px;">🔔 New Paid Booking</h2>
        <p style="color:#888;margin:0 0 16px;">Booking #${lead.id || ''}</p>
        <table style="border-collapse:collapse;font-size:15px;">${rowsHtml}</table>
        ${notesHtml}
      </div>`;

    await resend.emails.send({
      from: OWNER_NOTIFY_FROM,
      to: [OWNER_EMAIL],
      subject: `🔔 New booking — ${lead.customer_name || 'Customer'} (${lead.pickup || ''} → ${lead.destination || ''})`,
      html,
    });
    console.log(`[owner-notification] Enviado a ${OWNER_EMAIL} para lead ${lead.id}`);
  } catch (e) {
    console.error('[owner-notification] Falló el envío:', e);
  }
}

/**
 * Avisa al dueño que se le mandó al cliente el recordatorio de saldo
 * pendiente (12h antes del viaje). Igual que sendOwnerNotification, nunca
 * lanza error: si falla, solo lo registra en consola.
 */
export async function sendReminderSentNotification(lead: any, amountRemaining: number) {
  if (!resend || !lead) return;

  try {
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#111;margin:0 0 4px;">⏰ Payment Reminder Sent</h2>
        <p style="color:#888;margin:0 0 16px;">Booking #${lead.id || ''}</p>
        <table style="border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Customer</td><td style="padding:6px 0;font-weight:600;color:#111;">${lead.customer_name || ''}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Email</td><td style="padding:6px 0;font-weight:600;color:#111;">${lead.customer_email || ''}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Pickup</td><td style="padding:6px 0;font-weight:600;color:#111;">${lead.date} ${lead.time}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Route</td><td style="padding:6px 0;font-weight:600;color:#111;">${lead.pickup || ''} → ${lead.destination || ''}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Balance due</td><td style="padding:6px 0;font-weight:600;color:#111;">$${amountRemaining}</td></tr>
        </table>
        <p style="color:#888;margin-top:16px;">The customer was emailed a payment link for the remaining balance.</p>
      </div>`;

    await resend.emails.send({
      from: OWNER_NOTIFY_FROM,
      to: [OWNER_EMAIL],
      subject: `⏰ Reminder sent — ${lead.customer_name || 'Customer'} (balance due $${amountRemaining})`,
      html,
    });
    console.log(`[reminder-notification] Enviado a ${OWNER_EMAIL} para lead ${lead.id}`);
  } catch (e) {
    console.error('[reminder-notification] Falló el envío:', e);
  }
}

/**
 * Avisa de inmediato al dueño cuando llega una reseña negativa (no
 * recomienda). Nunca se publica sola en la web — queda en el CRM para que
 * el equipo la vea y pueda contactar al cliente. Nunca lanza error.
 */
export async function sendNegativeReviewAlert(review: {
  id: string
  customer_name: string
  customer_email?: string | null
  hotel_slug?: string | null
  rating?: number | null
  comment?: string | null
}) {
  if (!resend || !review) return;

  try {
    const stars = review.rating ? '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating) : 'N/A';
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#c0392b;margin:0 0 4px;">⚠️ Negative Review Received</h2>
        <p style="color:#888;margin:0 0 16px;">Not published — review only, in the CRM</p>
        <table style="border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Customer</td><td style="padding:6px 0;font-weight:600;color:#111;">${review.customer_name || ''}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Email</td><td style="padding:6px 0;font-weight:600;color:#111;">${review.customer_email || ''}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Hotel</td><td style="padding:6px 0;font-weight:600;color:#111;">${review.hotel_slug || ''}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;">Rating</td><td style="padding:6px 0;font-weight:600;color:#111;">${stars}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#888;vertical-align:top;">Comment</td><td style="padding:6px 0;font-weight:600;color:#111;">${review.comment || '(sin comentario)'}</td></tr>
        </table>
        <p style="color:#888;margin-top:16px;">Considera contactar al cliente para resolver lo que haya pasado.</p>
      </div>`;

    await resend.emails.send({
      from: OWNER_NOTIFY_FROM,
      to: [OWNER_EMAIL],
      subject: `⚠️ Reseña negativa — ${review.customer_name || 'Cliente'}`,
      html,
    });
    console.log(`[negative-review-alert] Enviado a ${OWNER_EMAIL} para review ${review.id}`);
  } catch (e) {
    console.error('[negative-review-alert] Falló el envío:', e);
  }
}
