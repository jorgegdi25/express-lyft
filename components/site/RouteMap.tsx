// Stylized South Florida route map (pure SVG, no Maps API cost). Same visual
// language as the booking map: dark land, gold route lines. Positions are
// projected from real coordinates so the geography reads correctly.

const PLACES = [
  { id: 'fll', label: 'FLL', sub: 'Fort Lauderdale Airport', x: 318, y: 58, anchor: 'end' as const },
  { id: 'mia', label: 'MIA', sub: 'Miami International', x: 111, y: 396, anchor: 'start' as const },
  { id: 'beach', label: 'Miami Beach', sub: '', x: 356, y: 392, anchor: 'start' as const },
  { id: 'port', label: 'PortMiami', sub: '', x: 292, y: 424, anchor: 'start' as const },
  { id: 'brickell', label: 'Brickell', sub: '', x: 250, y: 446, anchor: 'end' as const },
]

const ROUTES = [
  { d: 'M111 396 C 190 360, 290 360, 356 392', delay: 0 },
  { d: 'M111 396 C 170 420, 240 430, 292 424', delay: 400 },
  { d: 'M318 58 C 300 180, 285 300, 292 424', delay: 800 },
]

export default function RouteMap() {
  return (
    <figure className="relative rounded-3xl overflow-hidden" style={{ background: '#101010', border: '1px solid var(--border)' }}>
      <svg viewBox="0 0 500 540" className="w-full h-auto block" role="img" aria-label="Map of popular Express Lyft routes between MIA, FLL, PortMiami, Brickell and Miami Beach">
        <defs>
          <pattern id="rm-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
          <linearGradient id="rm-sea" x1="0" x2="1">
            <stop offset="0" stopColor="#0b1014" />
            <stop offset="1" stopColor="#070a0d" />
          </linearGradient>
        </defs>

        <rect width="500" height="540" fill="#141414" />
        <rect width="500" height="540" fill="url(#rm-grid)" />
        {/* Atlantic */}
        <path d="M402 0 C 396 120, 388 250, 376 350 C 370 410, 362 470, 352 540 L500 540 L500 0 Z" fill="url(#rm-sea)" />
        {/* Biscayne Bay */}
        <path d="M330 300 C 318 360, 300 400, 296 440 C 292 480, 300 520, 312 540 L352 540 C 356 480, 360 420, 366 350 C 362 330, 348 305, 330 300 Z" fill="#0b1014" />
        {/* Barrier island (Miami Beach) */}
        <path d="M372 310 C 368 360, 362 410, 356 470" stroke="#1d1d1d" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Highways (I-95, SR-836, I-195) */}
        <path d="M300 0 C 296 140, 280 300, 268 440 L262 540" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
        <path d="M60 404 C 140 400, 210 420, 268 430" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
        <path d="M276 380 L 364 376" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />

        {ROUTES.map((r, i) => (
          <g key={i}>
            <path d={r.d} stroke="rgba(212,175,55,0.18)" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path
              d={r.d}
              pathLength={100}
              className="route-draw"
              style={{ ['--route-length' as any]: 100, animationDelay: `${r.delay}ms` }}
              stroke="#D4AF37"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}

        {PLACES.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="11" fill="rgba(212,175,55,0.14)" />
            <circle cx={p.x} cy={p.y} r="4.5" fill="#D4AF37" stroke="#141414" strokeWidth="2" />
            <text
              x={p.anchor === 'start' ? p.x + 14 : p.x - 14}
              y={p.y - 4}
              textAnchor={p.anchor}
              fill="#fff"
              fontSize="14"
              fontWeight="700"
              fontFamily="Inter, Arial, sans-serif"
            >
              {p.label}
            </text>
            {p.sub && (
              <text x={p.anchor === 'start' ? p.x + 14 : p.x - 14} y={p.y + 13} textAnchor={p.anchor} fill="#8a8a8a" fontSize="11" fontFamily="Inter, Arial, sans-serif">
                {p.sub}
              </text>
            )}
          </g>
        ))}

        <text x="440" y="200" fill="#2c3a44" fontSize="11" letterSpacing="3" fontFamily="Inter, Arial, sans-serif" transform="rotate(90 440 200)">ATLANTIC OCEAN</text>
      </svg>
      <figcaption className="absolute left-4 bottom-4 md:left-6 md:bottom-6 text-[11px] uppercase tracking-[0.18em] text-white/50">
        Miami · Fort Lauderdale · South Florida
      </figcaption>
    </figure>
  )
}
