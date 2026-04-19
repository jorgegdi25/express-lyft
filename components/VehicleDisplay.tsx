'use client'

interface VehicleDisplayProps {
  passengers: number
  prices: { sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }
}

type VehicleType = 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'

function getVehicle(passengers: number): { type: VehicleType; label: string; capacity: string } {
  if (passengers <= 4) return { type: 'sedan_suv', label: 'Sedan & SUV', capacity: 'Up to 4 passengers' }
  if (passengers <= 6) return { type: 'suburban', label: 'Chevy Suburban', capacity: 'Up to 6 passengers' }
  if (passengers <= 14) return { type: 'sprinter', label: 'Mercedes-Benz Sprinter', capacity: 'Up to 14 passengers' }
  if (passengers <= 31) return { type: 'minibus', label: '31 Passenger Mini Bus', capacity: 'Up to 31 passengers' }
  return { type: 'coachbus', label: '55 Passenger Bus', capacity: 'Up to 55 passengers' }
}

export default function VehicleDisplay({ passengers, prices }: VehicleDisplayProps) {
  const vehicle = getVehicle(passengers)

  return (
    <div
      className="rounded-2xl p-8 flex flex-col gap-6 h-full backdrop-blur-xl"
      style={{ 
        background: 'rgba(26, 26, 26, 0.7)', 
        border: '1px solid rgba(184, 150, 12, 0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[4px]" style={{ color: '#666666' }}>
        Vehicle Selection
      </p>

      <div className="relative w-full rounded-lg bg-[#111111]" style={{ aspectRatio: '16/9' }}>
        <img
          src={`/vehicles/${vehicle.type}.png`}
          alt={vehicle.label}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src =
              'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80'
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold" style={{ color: '#B8960C', fontFamily: "'Playfair Display', Georgia, serif" }}>
          {vehicle.label}
        </p>
        <p className="text-sm italic" style={{ color: '#666666' }}>
          or similar
        </p>
        <p className="text-sm" style={{ color: '#FFFFFF' }}>
          {vehicle.capacity}
        </p>
      </div>

      <div
        className="mt-auto pt-4 flex items-center justify-between"
        style={{ borderTop: '1px solid #2a2a2a' }}
      >
        <p className="text-sm uppercase tracking-widest" style={{ color: '#999999' }}>
          Base Rate
        </p>
        <p className="text-2xl font-bold" style={{ color: '#EF9F27' }}>
          ${prices[vehicle.type]}
        </p>
      </div>
    </div>
  )
}
