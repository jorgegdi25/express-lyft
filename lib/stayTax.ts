// Impuesto de alojamiento (sales tax + tourist development tax de
// Miami-Dade/Broward, ~13%) — distinto del 7% de transporte en lib/tax.ts.
// Cobrado en QuickBooks como una línea de factura aparte (ver
// createAndSendStayInvoice en lib/quickbooks.ts), el mismo enfoque que ya
// usa el 7% de transporte — no el motor de Automated Sales Tax de
// QuickBooks, que necesitaría categorías fiscales por ítem que no tenemos
// configuradas.
export const STAY_LODGING_TAX_RATE_PERCENT = 13
