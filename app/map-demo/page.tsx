import React from 'react';
import MapBookingForm from '@/components/MapBookingForm';

export const metadata = {
  title: 'Map Booking Demo | Express Lyft',
  description: 'Demo of the map-based booking interface',
};

export default function MapDemoPage() {
  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      <MapBookingForm />
    </main>
  );
}
