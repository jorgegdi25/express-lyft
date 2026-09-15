'use client';

import React, { useEffect, useRef, useState } from 'react';

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

interface Suggestion {
  placePrediction: any;
  mainText: string;
  secondaryText: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MIAMI_CENTER = { lat: 25.7617, lng: -80.1918 };
// South Florida biasing box for autocomplete suggestions (not a hard restriction)
const SOUTH_FLORIDA_BOUNDS = { south: 25.0, west: -81.0, north: 27.0, east: -79.0 };

// Dark map theme approximating the previous Mapbox dark-v11 look
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

let googleMapsLoaderPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  if ((window as any).google?.maps?.places) return Promise.resolve((window as any).google);
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).google));
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

// Fetch driving distance/duration/polyline from the Routes API (the classic Directions
// API is no longer available to new Google Cloud projects, so this calls the newer
// computeRoutes REST endpoint directly instead of google.maps.DirectionsService).
async function fetchRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
  const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode: 'DRIVE',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Routes API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.routes?.[0] || null;
}

export default function MapRouteSelector({ onRouteCalculated, initialPickup, initialDestination }: MapRouteSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);
  const pickupSessionTokenRef = useRef<any>(null);
  const dropoffSessionTokenRef = useRef<any>(null);
  const pickupDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropoffDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropoffBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupText, setPickupText] = useState(initialPickup || '');
  const [dropoffText, setDropoffText] = useState(initialDestination || '');
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);

  const currentPickupCoords = useRef<{ lat: number; lng: number } | null>(null);
  const currentDropoffCoords = useRef<{ lat: number; lng: number } | null>(null);
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const pickupTextRef = useRef(pickupText);
  const dropoffTextRef = useRef(dropoffText);

  useEffect(() => { currentPickupCoords.current = pickupCoords; }, [pickupCoords]);
  useEffect(() => { currentDropoffCoords.current = dropoffCoords; }, [dropoffCoords]);
  useEffect(() => { onRouteCalculatedRef.current = onRouteCalculated; }, [onRouteCalculated]);
  useEffect(() => { pickupTextRef.current = pickupText; }, [pickupText]);
  useEffect(() => { dropoffTextRef.current = dropoffText; }, [dropoffText]);

  const reverseGeocode = (lat: number, lng: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!geocoderRef.current) return resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      geocoderRef.current.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        if (status === 'OK' && results?.[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      });
    });
  };

  const fetchSuggestions = async (input: string, sessionTokenRef: React.MutableRefObject<any>): Promise<Suggestion[]> => {
    if (!input || input.trim().length < 3) return [];
    const google = (window as any).google;
    if (!google?.maps?.places?.AutocompleteSuggestion) return [];

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }

    try {
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        locationBias: SOUTH_FLORIDA_BOUNDS,
        includedRegionCodes: ['us'],
        sessionToken: sessionTokenRef.current,
      });
      return (suggestions || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placePrediction: s.placePrediction,
          mainText: s.placePrediction.mainText?.text || s.placePrediction.text?.text || '',
          secondaryText: s.placePrediction.secondaryText?.text || '',
        }));
    } catch (err) {
      console.error('Autocomplete suggestions failed', err);
      return [];
    }
  };

  const selectSuggestion = async (suggestion: Suggestion, isPickup: boolean) => {
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      if (!place.location) return;
      const lat = place.location.lat();
      const lng = place.location.lng();
      const address = place.formattedAddress || suggestion.mainText;

      if (isPickup) {
        setPickupCoords({ lat, lng });
        setPickupText(address);
        setPickupSuggestions([]);
        pickupSessionTokenRef.current = null;
      } else {
        setDropoffCoords({ lat, lng });
        setDropoffText(address);
        setDropoffSuggestions([]);
        dropoffSessionTokenRef.current = null;
      }
    } catch (err) {
      console.error('Failed to fetch place details', err);
    }
  };

  const handlePickupChange = (value: string) => {
    setPickupText(value);
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    pickupDebounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(value, pickupSessionTokenRef);
      setPickupSuggestions(results);
    }, 250);
  };

  const handleDropoffChange = (value: string) => {
    setDropoffText(value);
    if (dropoffDebounceRef.current) clearTimeout(dropoffDebounceRef.current);
    dropoffDebounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(value, dropoffSessionTokenRef);
      setDropoffSuggestions(results);
    }, 250);
  };

  // Load SDK and initialize map + geocoder
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(async (google) => {
        if (cancelled || !mapContainerRef.current) return;

        await google.maps.importLibrary('geometry');

        const map = new google.maps.Map(mapContainerRef.current, {
          center: MIAMI_CENTER,
          zoom: 10,
          styles: DARK_MAP_STYLE,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        });

        mapRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        map.addListener('click', async (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const pc = currentPickupCoords.current;
          const dc = currentDropoffCoords.current;

          let isPickup = true;
          if (!pc) {
            isPickup = true;
          } else if (!dc) {
            isPickup = false;
          } else {
            const distP = Math.pow(lng - pc.lng, 2) + Math.pow(lat - pc.lat, 2);
            const distD = Math.pow(lng - dc.lng, 2) + Math.pow(lat - dc.lat, 2);
            isPickup = distP < distD;
          }

          const address = await reverseGeocode(lat, lng);

          if (isPickup) {
            setPickupCoords({ lat, lng });
            setPickupText(address);
          } else {
            setDropoffCoords({ lat, lng });
            setDropoffText(address);
          }
        });

        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps', err);
        if (!cancelled) setMapError('Could not load the map. Please refresh the page.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Manage pickup marker
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const google = (window as any).google;

    if (pickupCoords) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new google.maps.Marker({
          position: pickupCoords,
          map: mapRef.current,
          draggable: true,
          icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        });
        pickupMarkerRef.current.addListener('dragend', async () => {
          const pos = pickupMarkerRef.current.getPosition();
          const lat = pos.lat();
          const lng = pos.lng();
          setPickupCoords({ lat, lng });
          const address = await reverseGeocode(lat, lng);
          setPickupText(address);
        });
      } else {
        pickupMarkerRef.current.setPosition(pickupCoords);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
  }, [pickupCoords, isLoaded]);

  // Manage dropoff marker
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const google = (window as any).google;

    if (dropoffCoords) {
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = new google.maps.Marker({
          position: dropoffCoords,
          map: mapRef.current,
          draggable: true,
          icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        });
        dropoffMarkerRef.current.addListener('dragend', async () => {
          const pos = dropoffMarkerRef.current.getPosition();
          const lat = pos.lat();
          const lng = pos.lng();
          setDropoffCoords({ lat, lng });
          const address = await reverseGeocode(lat, lng);
          setDropoffText(address);
        });
      } else {
        dropoffMarkerRef.current.setPosition(dropoffCoords);
      }
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setMap(null);
      dropoffMarkerRef.current = null;
    }
  }, [dropoffCoords, isLoaded]);

  // Calculate route once both points are set
  useEffect(() => {
    if (!isLoaded || !pickupCoords || !dropoffCoords) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    const google = (window as any).google;
    let cancelled = false;

    fetchRoute(pickupCoords, dropoffCoords)
      .then((route) => {
        if (cancelled || !route) return;

        const path = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);

        if (routePolylineRef.current) {
          routePolylineRef.current.setPath(path);
        } else {
          routePolylineRef.current = new google.maps.Polyline({
            path,
            map: mapRef.current,
            strokeColor: '#B8960C',
            strokeWeight: 5,
            strokeOpacity: 0.75,
          });
        }

        const bounds = new google.maps.LatLngBounds();
        path.forEach((p: any) => bounds.extend(p));
        mapRef.current.fitBounds(bounds, 50);

        const distanceMiles = route.distanceMeters * 0.000621371;
        const durationSeconds = parseFloat(String(route.duration).replace('s', ''));
        const durationMinutes = durationSeconds / 60;

        onRouteCalculatedRef.current({
          pickup: pickupTextRef.current,
          destination: dropoffTextRef.current,
          distanceMiles,
          durationMinutes,
        });
      })
      .catch((err) => {
        console.error('Error fetching route', err);
      });

    return () => {
      cancelled = true;
    };
  }, [pickupCoords, dropoffCoords, isLoaded]);

  const suggestionDropdownClass =
    'absolute z-20 mt-1 w-full rounded-xl overflow-hidden border shadow-lg max-h-64 overflow-y-auto';
  const suggestionDropdownStyle = {
    background: 'var(--surface-raised)',
    borderColor: 'var(--border-soft)',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Address inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#BBBBBB' }}>
            Pickup Location
          </label>
          <input
            type="text"
            value={pickupText}
            placeholder="Pickup location (e.g., Miami Airport)"
            className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--gold)] placeholder-[var(--text-faint)]"
            style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
            onChange={(e) => handlePickupChange(e.target.value)}
            onFocus={() => { if (pickupBlurTimeoutRef.current) clearTimeout(pickupBlurTimeoutRef.current); }}
            onBlur={() => { pickupBlurTimeoutRef.current = setTimeout(() => setPickupSuggestions([]), 150); }}
          />
          {pickupSuggestions.length > 0 && (
            <div className={suggestionDropdownClass} style={suggestionDropdownStyle}>
              {pickupSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s, true); }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                  style={{ color: '#ddd', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)' }}
                >
                  <div style={{ color: 'var(--text)' }}>{s.mainText}</div>
                  {s.secondaryText && (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.secondaryText}</div>
                  )}
                </button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Green marker (click map or drag to set)
          </p>
        </div>
        <div className="relative">
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#BBBBBB' }}>
            Destination
          </label>
          <input
            type="text"
            value={dropoffText}
            placeholder="Destination (e.g., B Ocean Resort)"
            className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--gold)] placeholder-[var(--text-faint)]"
            style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
            onChange={(e) => handleDropoffChange(e.target.value)}
            onFocus={() => { if (dropoffBlurTimeoutRef.current) clearTimeout(dropoffBlurTimeoutRef.current); }}
            onBlur={() => { dropoffBlurTimeoutRef.current = setTimeout(() => setDropoffSuggestions([]), 150); }}
          />
          {dropoffSuggestions.length > 0 && (
            <div className={suggestionDropdownClass} style={suggestionDropdownStyle}>
              {dropoffSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s, false); }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                  style={{ color: '#ddd', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)' }}
                >
                  <div style={{ color: 'var(--text)' }}>{s.mainText}</div>
                  {s.secondaryText && (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.secondaryText}</div>
                  )}
                </button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Red marker (click map or drag to set)
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-[var(--border-soft)] cursor-pointer"
        title="Click anywhere on the map to set a location, or drag the markers"
      />
      {mapError && (
        <p className="text-sm text-red-400">{mapError}</p>
      )}
    </div>
  );
}
