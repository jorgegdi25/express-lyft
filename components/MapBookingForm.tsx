'use client';

import React, { useState } from 'react';

// Styling tokens matching the main BookingForm
const LABEL_CLASS = 'text-sm font-semibold mb-2 block';
const LABEL_COLOR = { color: '#BBBBBB' };
const INPUT_CLASS = 'w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[#B8960C] placeholder-[#666]';
const INPUT_STYLE = { background: '#0e0e0e', border: '1px solid #333333', color: '#FFFFFF' };

export default function MapBookingForm() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full font-sans" style={{ background: '#111111' }}>
      
      {/* Left Panel: Form (Dark Luxury Theme) */}
      <div 
        className="w-full lg:w-[480px] flex-shrink-0 flex flex-col h-full z-10 relative overflow-y-auto"
        style={{ 
          background: '#161616', 
          borderRight: '1px solid #2a2a2a',
          boxShadow: '24px 0 60px rgba(0,0,0,0.8)' 
        }}
      >
        <div className="p-8 md:p-10 flex flex-col flex-grow">
          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
              Map Demo
            </p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}>
              Where would you like to go?
            </h2>
            <p className="text-sm mt-3" style={{ color: '#999999' }}>
              Select your pickup and destination on the map or enter the addresses below.
            </p>
          </div>

          {/* Form Inputs */}
          <div className="relative mb-8 p-6 rounded-2xl" style={{ background: '#0a0a0a', border: '1px solid #222' }}>
            {/* Connection Line */}
            <div className="absolute left-[35px] top-[45px] bottom-[45px] w-[2px]" style={{ background: '#333' }}></div>
            
            {/* Pickup Input */}
            <div className="relative flex items-center mb-6">
              <div className="w-[10px] h-[10px] rounded-full absolute left-[11px] top-1/2 -translate-y-1/2 z-10 ring-4" style={{ background: '#B8960C', ringColor: '#0a0a0a' }}></div>
              <div className="w-full pl-8">
                <label className={LABEL_CLASS} style={LABEL_COLOR}>Pickup Location</label>
                <input 
                  type="text" 
                  placeholder="Enter pickup or drag pin" 
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
            </div>

            {/* Dropoff Input */}
            <div className="relative flex items-center">
              <div className="w-[10px] h-[10px] absolute left-[11px] top-1/2 -translate-y-1/2 z-10 ring-4" style={{ background: '#FFFFFF', ringColor: '#0a0a0a' }}></div>
              <div className="w-full pl-8">
                <label className={LABEL_CLASS} style={LABEL_COLOR}>Destination</label>
                <input 
                  type="text" 
                  placeholder="Enter destination" 
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-lg mt-4"
            style={{ 
              background: 'linear-gradient(135deg, #B8960C, #D4AF37)', 
              color: '#111111' 
            }}
          >
            Calculate Price
          </button>

          {/* Footer Branding */}
          <div className="mt-auto pt-8">
            <div className="h-[1px] w-full mb-6" style={{ background: 'linear-gradient(90deg, transparent, #333, transparent)' }}></div>
            <p className="text-xs font-semibold tracking-widest text-center uppercase" style={{ color: '#666' }}>
              Express Lyft
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Map Image Placeholder */}
      <div className="flex-grow h-[50vh] lg:h-full relative overflow-hidden" style={{ background: '#000' }}>
        {/* Map placeholder styled to look like a dark mode map */}
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Map Placeholder" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
          style={{ filter: 'invert(1) hue-rotate(180deg) contrast(1.2)' }}
        />
        
        {/* Overlay gradient to blend map edges softly */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/80 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent lg:hidden pointer-events-none"></div>
        
        {/* Fake Luxury Pin on the map */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center drop-shadow-2xl animate-bounce">
          <div className="px-5 py-2.5 rounded-full font-bold text-sm mb-3 shadow-2xl tracking-wide uppercase text-xs" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#000' }}>
            Set Pickup
          </div>
          <div className="w-5 h-5 rounded-full shadow-lg" style={{ background: '#B8960C', border: '3px solid #111' }}></div>
          <div className="w-1 h-10" style={{ background: 'linear-gradient(to bottom, #B8960C, transparent)' }}></div>
        </div>
      </div>

    </div>
  );
}
