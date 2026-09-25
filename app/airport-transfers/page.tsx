import ServicePage, { serviceMetadata } from '@/components/site/ServicePage'

export const revalidate = 300
export const metadata = serviceMetadata('airport-transfers')

export default function Page() {
  return <ServicePage slug="airport-transfers" />
}
