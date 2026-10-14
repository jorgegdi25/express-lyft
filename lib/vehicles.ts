// Human-readable vehicle names, shared by anywhere a vehicle_type code needs
// to be shown to a guest or the owner (emails, CRM).
export const VEHICLE_LABELS: Record<string, string> = {
  sedan_suv: 'Sedan & SUV',
  suburban: 'Chevy Suburban',
  sprinter: 'Mercedes-Benz Sprinter',
  minibus: '31 Passenger Mini Bus',
  coachbus: '55 Passenger Bus',
}

// Vehicles the public forms never price: the guest submits a request and the
// team calls back with a quote. The server enforces this too.
export const QUOTE_ONLY_VEHICLES = ['sprinter', 'minibus', 'coachbus']

export function isQuoteOnly(vehicleType: string | null | undefined): boolean {
  return !!vehicleType && QUOTE_ONLY_VEHICLES.includes(vehicleType)
}
