'use client';

import React, { useState } from 'react';

export default function MapBookingForm() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-white text-black font-sans">
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col h-full bg-white shadow-2xl z-10 relative">
        <div className="p-8 flex flex-col flex-grow">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Express Lyft</h1>
            <p className="text-gray-500 mt-2">Premium Hotel Transportation</p>
          </div>

          <h2 className="text-2xl font-bold mb-6">Where to?</h2>

          <div className="relative mb-6">
            {/* Connection Line */}
            <div className="absolute left-[11px] top-[24px] bottom-[24px] w-[2px] bg-gray-300"></div>
            
            {/* Pickup Input */}
            <div className="relative flex items-center mb-4">
              <div className="w-[8px] h-[8px] rounded-full bg-black absolute left-[8px] top-1/2 -translate-y-1/2 z-10 ring-4 ring-white"></div>
              <input 
                type="text" 
                placeholder="Pickup location (e.g. Hotel)" 
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg outline-none focus:bg-gray-200 transition-colors text-black placeholder-gray-500"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
            </div>

            {/* Dropoff Input */}
            <div className="relative flex items-center">
              <div className="w-[8px] h-[8px] bg-black absolute left-[8px] top-1/2 -translate-y-1/2 z-10 ring-4 ring-white"></div>
              <input 
                type="text" 
                placeholder="Destination" 
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg outline-none focus:bg-gray-200 transition-colors text-black placeholder-gray-500"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
              />
            </div>
          </div>

          <button className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition-colors shadow-lg">
            See Prices
          </button>

          {/* Additional info or hotel branding could go here */}
          <div className="mt-auto pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Powered by Express Lyft CRM
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Map Image Placeholder */}
      <div className="flex-grow h-[50vh] lg:h-full relative bg-gray-200 overflow-hidden">
        {/* We use a high quality placeholder map image */}
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Map Placeholder" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        
        {/* Overlay gradient for a premium look */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
        
        {/* Fake Pin on the map */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center drop-shadow-xl animate-bounce">
          <div className="bg-black text-white px-4 py-2 rounded-full font-bold text-sm mb-2 shadow-lg">
            Set Pickup
          </div>
          <div className="w-4 h-4 rounded-full bg-black border-4 border-white shadow-md"></div>
          <div className="w-1 h-8 bg-black"></div>
          <div className="w-2 h-1 bg-black/50 rounded-full blur-sm"></div>
        </div>
      </div>

    </div>
  );
}
