// Canonical jet ski pricing for the public /jetski checkout — mirrors the
// jet_ski half of WATERCRAFT_CATALOG in app/admin/page.tsx (Dennis's real
// price sheet). Kept separate rather than imported from the admin page
// because that file is a client component; this one is read server-side in
// app/api/leads/route.ts to price public bookings without trusting the
// amount the browser sends.
export const JETSKI_PACKAGES = {
  'Single Jet Ski': {
    machines: 1,
    durations: { '1 Hour': 150, '2 Hours': 300, 'Half Day (4 hrs)': 450, 'Full Day (8 hrs)': 800 },
  },
  'Double Jet Ski (2-seater)': {
    machines: 1,
    durations: { '1 Hour': 150, '2 Hours': 300, 'Half Day (4 hrs)': 450, 'Full Day (8 hrs)': 800 },
  },
  'Two Jet Skis (two machines)': {
    machines: 2,
    durations: { '2 Hours': 500, 'Half Day (4 hrs)': 800, 'Full Day (8 hrs)': 1200 },
  },
} as const

export type JetskiPackageName = keyof typeof JETSKI_PACKAGES

export function jetskiPackagePrice(pkg: string, duration: string): number | null {
  const p = JETSKI_PACKAGES[pkg as JetskiPackageName]
  if (!p) return null
  const price = (p.durations as Record<string, number>)[duration]
  return price ?? null
}

export function jetskiMachineCount(pkg: string): number {
  return JETSKI_PACKAGES[pkg as JetskiPackageName]?.machines ?? 1
}

export const JETSKI_TRANSPORT_PRICES = {
  none: 0,
  one_way: 10,
  round_trip: 20,
} as const

export type JetskiTransportOption = keyof typeof JETSKI_TRANSPORT_PRICES

export const JETSKI_MAX_MACHINES_PER_SLOT = 4
export const JETSKI_MEETING_ADDRESS = '919 N Birch Rd, Fort Lauderdale, FL 33304'
