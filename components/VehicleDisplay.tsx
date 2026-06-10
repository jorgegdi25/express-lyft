'use client'
import Image from 'next/image'

interface VehicleDisplayProps {
  passengers: number
  prices: { sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }
  selectedVehicleType: VehicleType
  onSelectVehicle: (type: VehicleType) => void
}

export type VehicleType = 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'

export interface VehicleInfo {
  type: VehicleType
  label: string
  shortLabel: string
  capacity: string
  maxPassengers: number
}

export const VEHICLES: VehicleInfo[] = [
  { type: 'sedan_suv',  label: 'Sedan & SUV',            shortLabel: 'Sedan',     capacity: 'Up to 4 passengers',  maxPassengers: 4  },
  { type: 'suburban',   label: 'Chevy Suburban',          shortLabel: 'Suburban',  capacity: 'Up to 6 passengers',  maxPassengers: 6  },
  { type: 'sprinter',   label: 'Mercedes-Benz Sprinter',  shortLabel: 'Sprinter',  capacity: 'Up to 14 passengers', maxPassengers: 14 },
  { type: 'minibus',    label: '31 Passenger Mini Bus',   shortLabel: 'Mini Bus',  capacity: 'Up to 31 passengers', maxPassengers: 31 },
  { type: 'coachbus',   label: '55 Passenger Bus',        shortLabel: 'Coach Bus', capacity: 'Up to 55 passengers', maxPassengers: 55 },
]

export function getMinimumVehicle(passengers: number): VehicleInfo {
  return VEHICLES.find((v) => passengers <= v.maxPassengers) ?? VEHICLES[VEHICLES.length - 1]
}

export default function VehicleDisplay({ passengers, prices, selectedVehicleType, onSelectVehicle }: VehicleDisplayProps) {
  const vehicle = VEHICLES.find((v) => v.type === selectedVehicleType) || getMinimumVehicle(passengers)

  return (
    <div
      className="rounded-2xl p-7 md:p-10 flex flex-col gap-6"
      style={{
        background: '#161616',
        border: '1px solid #2a2a2a',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
          2. Select Your Vehicle
        </h3>
        <p className="text-sm mt-1" style={{ color: '#888888' }}>
          Select your preferred vehicle class
        </p>
      </div>

      {/* Vehicle image */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9', background: '#0e0e0e' }}
      >
        <Image
          src={`/vehicles/${vehicle.type}.png`}
          alt={vehicle.label}
          fill
          className="object-cover"
        />
      </div>

      {/* Vehicle info */}
      <div className="flex flex-col gap-2">
        <h3
          className="text-2xl md:text-3xl font-bold"
          style={{ color: '#B8960C', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {vehicle.label}
        </h3>
        <p className="text-sm italic" style={{ color: '#777777' }}>
          or similar vehicle class
        </p>
        <p className="text-base font-medium" style={{ color: '#CCCCCC' }}>
          {vehicle.capacity}
        </p>
      </div>

      {/* Vehicle selector — interactive buttons */}
      <div className="flex gap-2 flex-wrap">
        {VEHICLES.map((v) => {
          const isDisabled = passengers > v.maxPassengers
          const isSelected = v.type === vehicle.type
          
          return (
            <button
              key={v.type}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectVehicle(v.type)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1"
              style={{
                background: isSelected ? 'rgba(184,150,12,0.15)' : 'transparent',
                border: `1px solid ${isSelected ? '#B8960C' : '#2a2a2a'}`,
                color: isSelected ? '#D4AF37' : (isDisabled ? '#444444' : '#888888'),
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1
              }}
            >
              <span>{v.shortLabel}</span>
              <span style={{ fontSize: '0.7rem', color: isSelected ? '#EF9F27' : (isDisabled ? '#333333' : '#666666') }}>
                ${prices[v.type]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Price row */}
      <div
        className="mt-auto rounded-xl px-5 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(184,150,12,0.08)',
          border: '1px solid rgba(184,150,12,0.25)',
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#B8960C' }}>
            Base Rate
          </p>
          <p className="text-xs" style={{ color: '#777777' }}>
            One-way transfer
          </p>
        </div>
        <span
          className="text-4xl font-bold"
          style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          ${prices[vehicle.type]}
        </span>
      </div>

      {/* Trust note */}
      <div className="flex items-start gap-3 pt-2" style={{ borderTop: '1px solid #222222' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" className="shrink-0 mt-0.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
          All vehicles are professional-grade, fully insured, and operated by certified chauffeurs.
        </p>
      </div>
    </div>
  )
}
