// Shared by every place that builds an invoice/checkout line description for
// a transport lead (app/api/leads/route.ts, app/api/admin/invoices,
// app/api/admin/quickbooks-invoice, app/api/admin/quickbooks-payment-link).
// Jet Ski / Boat bookings don't have a pickup/destination route — they have
// a service_detail summary instead (e.g. "Single Jet Ski — 2 Hours"), set
// from the "Add Reservation" modal's watercraft package picker.
export function leadInvoiceDescription(lead: {
  service_type?: string | null
  service_detail?: string | null
  pickup?: string | null
  destination?: string | null
  date?: string | null
  time?: string | null
  vehicle_type?: string | null
  passengers?: number | null
}) {
  if (lead.service_type && lead.service_type !== 'transport') {
    const label = lead.service_type === 'jet_ski' ? 'Jet Ski Rental' : 'Boat Rental'
    return `Express Lyft ${label}: ${lead.service_detail || label} (${lead.date} at ${lead.time}) | ${lead.passengers} passengers`
  }
  return `Express Lyft Reservation: ${lead.pickup} to ${lead.destination} (${lead.date} at ${lead.time}) | ${lead.vehicle_type} | ${lead.passengers} passengers`
}
