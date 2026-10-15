import HomeV2 from '@/components/site/home/HomeV2'
import LegacyHome from '@/components/LegacyHome'
import { SITE_V2_LIVE } from '@/lib/site/contact'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Express Lyft 2.0 is the home page on every host once launched. The
// previous home stays as the rollback (SITE_V2_LIVE = false) and at /anterior.
export default async function HomePage({ searchParams }: { searchParams: { success?: string; tab?: string } }) {
  if (SITE_V2_LIVE) return <HomeV2 />
  return <LegacyHome searchParams={searchParams} />
}
