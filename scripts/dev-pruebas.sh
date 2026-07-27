#!/usr/bin/env bash
# Levanta `next dev` apuntando a la base de PRUEBAS (no producción) y sin
# credenciales de Google Calendar, para poder probar cambios del CRM sin
# tocar datos reales ni crear eventos en el calendario real.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env.pruebas
set +a

export SUPABASE_URL="https://elymsqzunfaovsuiqesn.supabase.co"
export SUPABASE_ANON_KEY="$PRUEBAS_ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$PRUEBAS_SERVICE_KEY"
export GOOGLE_CALENDAR_ID=""
export GOOGLE_SERVICE_ACCOUNT_KEY=""

exec npx next dev -p 3300
