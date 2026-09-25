import ServicePage, { serviceMetadata } from '@/components/site/ServicePage'

export const revalidate = 300
export const metadata = serviceMetadata('cruise-port-transfers')

export default function Page() {
  return <ServicePage slug="cruise-port-transfers" />
}
