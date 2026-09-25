import ServicePage, { serviceMetadata } from '@/components/site/ServicePage'

export const revalidate = 300
export const metadata = serviceMetadata('hotel-transfers')

export default function Page() {
  return <ServicePage slug="hotel-transfers" />
}
