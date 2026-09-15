// Carga masiva del catálogo de 127 hoteles de Fort Lauderdale en `stay_hotels`.
// Todos quedan `active = false` — no se muestran en /stay hasta que alguien
// los active desde el admin. Requiere que la migración
// supabase-migrations-stay-catalog.sql ya se haya corrido en Supabase.
//
// Uso:  node scripts/import-stay-catalog.mjs [--dry-run]

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

const PHOTO_BASE = '/Users/jorgegonzalezmejia/Documents/Codex/2026-09-09/t-puedes-hacerme-una-investigaci-n/outputs/fotos_hoteles_fort_lauderdale'
const HOTELS_JSON = '/Users/jorgegonzalezmejia/Desktop/express lyft/hoteles/work_import/hotels.json'
const BUCKET = 'hotel-photos'
const TRANSPORT_AMOUNT = 45
const ROOMS_AVAILABLE = 5
const MAX_SIZE_BYTES = 5 * 1024 * 1024

const EXT_MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno (.env.local).')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })

function findPhoto(folder, base) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.gif']) {
    const p = path.join(PHOTO_BASE, folder, base + ext)
    if (fs.existsSync(p)) return p
  }
  return null
}

async function uploadPhoto(filePath, destName) {
  const ext = path.extname(filePath).toLowerCase()
  const mime = EXT_MIME[ext]
  const stat = fs.statSync(filePath)
  if (stat.size > MAX_SIZE_BYTES) {
    throw new Error(`${filePath} pesa ${(stat.size / 1024 / 1024).toFixed(2)}MB (>5MB)`)
  }
  const buffer = fs.readFileSync(filePath)
  const storagePath = `stay-catalog/${destName}${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, { contentType: mime, upsert: true })
  if (error) throw new Error(`Upload ${storagePath}: ${error.message}`)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

// Ya existen como hoteles activos reales (nombres distintos a los del
// directorio, por eso el dedupe por nombre exacto no los agarra) — no
// crear un segundo registro para el mismo hotel físico.
const EXCLUDE_NUMEROS = new Set([
  103, // B OCEAN RESORT FORT LAUDERDALE == "B Ocean Resort Fort Lauderdale Beach"
  109, // HAMPTON INN FORT LAUDERDALE AIRPORT NORTH CRUISE PORT == "Hampton Inn Ft. Lauderdale Airport North Cruise Port"
  72,  // AC HOTEL FORT LAUDERDALE BEACH == "AC Marriott hotel, central beach"
])

async function main() {
  const allHotels = JSON.parse(fs.readFileSync(HOTELS_JSON, 'utf-8'))
  const hotels = allHotels.filter(h => !EXCLUDE_NUMEROS.has(h.numero))
  console.log(`Cargando ${hotels.length} hoteles (excluidos ${allHotels.length - hotels.length} ya activos)${DRY_RUN ? ' — DRY RUN, no escribe nada' : ''}...`)

  const { data: existing, error: existingErr } = await supabase.from('stay_hotels').select('name')
  if (existingErr) {
    console.error('No pude leer stay_hotels existentes:', existingErr.message)
    process.exit(1)
  }
  const existingNames = new Set((existing || []).map(h => h.name.trim().toUpperCase()))

  let inserted = 0, skipped = 0, failed = 0

  for (const hotel of hotels) {
    const nameKey = hotel.name.trim().toUpperCase()
    if (existingNames.has(nameKey)) {
      console.log(`– ya existe, salto: ${hotel.name}`)
      skipped++
      continue
    }

    const principalPath = findPhoto(hotel.folder, '01_principal')
    const roomPath = findPhoto(hotel.folder, '02_habitacion')
    if (!principalPath) {
      console.error(`✗ sin foto principal: ${hotel.name} (${hotel.folder})`)
      failed++
      continue
    }

    try {
      let photo_url = null, room_photo_url = null
      if (!DRY_RUN) {
        photo_url = await uploadPhoto(principalPath, `${hotel.folder}-principal`)
        if (roomPath) room_photo_url = await uploadPhoto(roomPath, `${hotel.folder}-room`)

        const { error: insertErr } = await supabase.from('stay_hotels').insert({
          name: hotel.name,
          photo_url,
          room_photo_url,
          price: hotel.price,
          transport_amount: TRANSPORT_AMOUNT,
          rooms_available: ROOMS_AVAILABLE,
          active: false,
          sort_order: hotel.numero,
          zone: hotel.zone || null,
          category: hotel.category || null,
        })
        if (insertErr) throw new Error(insertErr.message)
      }
      console.log(`✓ ${hotel.name}  [$${hotel.price} · ${hotel.zone} · ${hotel.category}]`)
      existingNames.add(nameKey) // evita duplicados dentro de la misma corrida (el directorio trae 1 nombre repetido)
      inserted++
    } catch (e) {
      console.error(`✗ ${hotel.name}: ${e.message}`)
      failed++
    }
  }

  console.log(`\nListo. Insertados: ${inserted} · Ya existían: ${skipped} · Fallidos: ${failed}`)
}

main()
