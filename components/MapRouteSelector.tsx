'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

interface RouteData {
  pickup: string;
  destination: string;
  distanceMiles: number;
  durationMinutes: number;
}

interface MapRouteSelectorProps {
  onRouteCalculated: (data: RouteData) => void;
  initialPickup?: string;
  initialDestination?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function MapRouteSelector({ onRouteCalculated, initialPickup, initialDestination }: MapRouteSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const pickupGeocoderContainerRef = useRef<HTMLDivElement>(null);
  const dropoffGeocoderContainerRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);
  const [pickupText, setPickupText] = useState(initialPickup || '');
  const [dropoffText, setDropoffText] = useState(initialDestination || '');

  const pickupGeocoderRef = useRef<MapboxGeocoder | null>(null);
  const dropoffGeocoderRef = useRef<MapboxGeocoder | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const currentPickupCoords = useRef<[number, number] | null>(null);
  const currentDropoffCoords = useRef<[number, number] | null>(null);
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const pickupTextRef = useRef(pickupText);
  const dropoffTextRef = useRef(dropoffText);

  useEffect(() => { currentPickupCoords.current = pickupCoords; }, [pickupCoords]);
  useEffect(() => { currentDropoffCoords.current = dropoffCoords; }, [dropoffCoords]);
  useEffect(() => { onRouteCalculatedRef.current = onRouteCalculated; }, [onRouteCalculated]);
  useEffect(() => { pickupTextRef.current = pickupText; }, [pickupText]);
  useEffect(() => { dropoffTextRef.current = dropoffText; }, [dropoffText]);

  // Helper for Reverse Geocoding
  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const res = await fetch(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${MAPBOX_TOKEN}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].properties.full_address || data.features[0].properties.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (e) {
      console.error('Reverse geocode error:', e);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-80.1918, 25.7617], // Miami
      zoom: 10,
    });

    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    newMap.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      const pc = currentPickupCoords.current;
      const dc = currentDropoffCoords.current;
      
      let isPickup = true;
      if (!pc) {
        isPickup = true;
      } else if (!dc) {
        isPickup = false;
      } else {
        // Both exist, move closest
        const distP = Math.pow(lng - pc[0], 2) + Math.pow(lat - pc[1], 2);
        const distD = Math.pow(lng - dc[0], 2) + Math.pow(lat - dc[1], 2);
        isPickup = distP < distD;
      }

      const address = await reverseGeocode(lng, lat);

      if (isPickup) {
        setPickupCoords([lng, lat]);
        setPickupText(address);
        if (pickupGeocoderRef.current) pickupGeocoderRef.current.setInput(address);
      } else {
        setDropoffCoords([lng, lat]);
        setDropoffText(address);
        if (dropoffGeocoderRef.current) dropoffGeocoderRef.current.setInput(address);
      }
    });

    setMap(newMap);

    return () => newMap.remove();
  }, []);

  // Initialize Geocoders
  useEffect(() => {
    if (!pickupGeocoderContainerRef.current || !dropoffGeocoderContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const pickupGeocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      placeholder: 'Pickup location (e.g., Miami Airport)',
      mapboxgl: mapboxgl as any,
      marker: false,
      bbox: [-81.0, 25.0, -79.0, 27.0], // Limit search roughly to South Florida
    });

    const dropoffGeocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      placeholder: 'Destination (e.g., B Ocean Resort)',
      mapboxgl: mapboxgl as any,
      marker: false,
      bbox: [-81.0, 25.0, -79.0, 27.0],
    });

    pickupGeocoderRef.current = pickupGeocoder;
    dropoffGeocoderRef.current = dropoffGeocoder;

    pickupGeocoder.addTo(pickupGeocoderContainerRef.current);
    dropoffGeocoder.addTo(dropoffGeocoderContainerRef.current);

    pickupGeocoder.on('result', (e) => {
      setPickupCoords(e.result.center);
      setPickupText(e.result.place_name);
    });

    dropoffGeocoder.on('result', (e) => {
      setDropoffCoords(e.result.center);
      setDropoffText(e.result.place_name);
    });

    pickupGeocoder.on('clear', () => {
      setPickupCoords(null);
      setPickupText('');
    });

    dropoffGeocoder.on('clear', () => {
      setDropoffCoords(null);
      setDropoffText('');
    });

    return () => {
      if (pickupGeocoderContainerRef.current) {
        pickupGeocoderContainerRef.current.innerHTML = '';
      }
      if (dropoffGeocoderContainerRef.current) {
        dropoffGeocoderContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Manage Pickup Marker
  useEffect(() => {
    if (!map) return;
    if (pickupCoords) {
      if (!pickupMarkerRef.current) {
        // Create marker
        pickupMarkerRef.current = new mapboxgl.Marker({ color: '#22c55e', draggable: true })
          .setLngLat(pickupCoords)
          .addTo(map);

        pickupMarkerRef.current.on('dragend', async () => {
          const lngLat = pickupMarkerRef.current?.getLngLat();
          if (!lngLat) return;
          setPickupCoords([lngLat.lng, lngLat.lat]);
          const address = await reverseGeocode(lngLat.lng, lngLat.lat);
          setPickupText(address);
          if (pickupGeocoderRef.current) pickupGeocoderRef.current.setInput(address);
        });
      } else {
        // Update existing marker
        pickupMarkerRef.current.setLngLat(pickupCoords);
      }
    } else {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }
    }
  }, [map, pickupCoords]);

  // Manage Dropoff Marker
  useEffect(() => {
    if (!map) return;
    if (dropoffCoords) {
      if (!dropoffMarkerRef.current) {
        // Create marker
        dropoffMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444', draggable: true })
          .setLngLat(dropoffCoords)
          .addTo(map);

        dropoffMarkerRef.current.on('dragend', async () => {
          const lngLat = dropoffMarkerRef.current?.getLngLat();
          if (!lngLat) return;
          setDropoffCoords([lngLat.lng, lngLat.lat]);
          const address = await reverseGeocode(lngLat.lng, lngLat.lat);
          setDropoffText(address);
          if (dropoffGeocoderRef.current) dropoffGeocoderRef.current.setInput(address);
        });
      } else {
        // Update existing marker
        dropoffMarkerRef.current.setLngLat(dropoffCoords);
      }
    } else {
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.remove();
        dropoffMarkerRef.current = null;
      }
    }
  }, [map, dropoffCoords]);

  // Calculate Route when both coordinates are available
  useEffect(() => {
    if (!map || !pickupCoords || !dropoffCoords) {
      if (map && map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
      }
      return;
    }

    const getRoute = async () => {
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${dropoffCoords[0]},${dropoffCoords[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
        );
        const json = await query.json();
        const data = json.routes[0];
        
        if (!data) return;

        const route = data.geometry.coordinates;
        
        // Convert distance from meters to miles
        const distanceMiles = data.distance * 0.000621371;
        // Convert duration from seconds to minutes
        const durationMinutes = data.duration / 60;

        onRouteCalculatedRef.current({
          pickup: pickupTextRef.current,
          destination: dropoffTextRef.current,
          distanceMiles,
          durationMinutes,
        });

        const geojson = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: route,
          },
        };

        if (map.getSource('route')) {
          (map.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
        } else {
          map.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson,
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#B8960C',
              'line-width': 5,
              'line-opacity': 0.75,
            },
          });
        }

        // Fit map bounds to the route
        const coordinates = route;
        const bounds = coordinates.reduce((b: mapboxgl.LngLatBounds, coord: [number, number]) => {
          return b.extend(coord as mapboxgl.LngLatLike);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.fitBounds(bounds, {
          padding: 50,
        });

      } catch (err) {
        console.error('Error fetching route', err);
      }
    };

    getRoute();

  }, [map, pickupCoords, dropoffCoords]);

  return (
    <div className="flex flex-col gap-4">
      {/* Geocoder inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#BBBBBB' }}>
            Pickup Location
          </label>
          <div ref={pickupGeocoderContainerRef} className="mapbox-geocoder-container" />
          <p className="text-[11px] text-[#888] mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Green marker (click map or drag to set)
          </p>
        </div>
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#BBBBBB' }}>
            Destination
          </label>
          <div ref={dropoffGeocoderContainerRef} className="mapbox-geocoder-container" />
          <p className="text-[11px] text-[#888] mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Red marker (click map or drag to set)
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-[#333333] cursor-pointer"
        title="Click anywhere on the map to set a location, or drag the markers"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder {
          width: 100%;
          max-width: 100%;
          background: #0e0e0e;
          border: 1px solid #333333;
          border-radius: 0.75rem;
          box-shadow: none;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder input {
          color: #FFFFFF;
          padding-left: 40px;
          height: 50px;
          font-size: 16px;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .mapboxgl-ctrl-geocoder--icon-search {
          fill: #888888;
          top: 13px;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .mapboxgl-ctrl-geocoder--icon-close {
          fill: #888888;
          margin-top: 5px;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .suggestions {
          background: #161616;
          border: 1px solid #333333;
          color: #fff;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .suggestions > li > a {
          color: #ddd;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .suggestions > li.active > a,
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .suggestions > li:hover > a {
          background: #2a2a2a;
          color: #fff;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder .suggestions > .active > a {
          background: #2a2a2a;
        }
      `}} />
    </div>
  );
}
