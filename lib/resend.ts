import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Dirección donde el dueño recibe los avisos de nuevas reservas.
// IMPORTANTE: debe ser DISTINTA del remitente (book@explyft.com); si es la
// misma, Google Workspace descarta el correo por "auto-envío"/spoofing.
export const OWNER_EMAIL = process.env.OWNER_EMAIL || 'info@explyft.com';

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
      lead.trip_type === 'roundtrip'
        ? ['Return', [lead.return_date, lead.return_time].filter(Boolean).join(' ')]
        : ['Trip type', lead.trip_type || 'One way'],
      ['Vehicle', vehicle],
      ['Passengers', lead.passengers],
      ['Airline / Flight', [lead.airline, lead.flight_number].filter(Boolean).join(' ')],
      ['Meeting', lead.meeting_type],
      ['Payment', isDeposit ? 'Deposit' : 'Full payment'],
      ['Paid', money(paid)],
      isDeposit ? ['Balance due', money(remaining)] : ['', ''],
    ];

    const rowsHtml = rows
      .filter(([label, value]) => label && value !== null && value !== undefined && value !== '')
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#888;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-weight:600;color:#111;">${value}</td></tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#111;margin:0 0 4px;">🔔 New Paid Booking</h2>
        <p style="color:#888;margin:0 0 16px;">Booking #${lead.id || ''}</p>
        <table style="border-collapse:collapse;font-size:15px;">${rowsHtml}</table>
      </div>`;

    await resend.emails.send({
      from: 'Express Lyft <book@explyft.com>',
      to: [OWNER_EMAIL],
      subject: `🔔 New booking — ${lead.customer_name || 'Customer'} (${lead.pickup || ''} → ${lead.destination || ''})`,
      html,
    });
    console.log(`[owner-notification] Enviado a ${OWNER_EMAIL} para lead ${lead.id}`);
  } catch (e) {
    console.error('[owner-notification] Falló el envío:', e);
  }
}
