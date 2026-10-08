'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CONTACT } from '@/lib/site/contact';

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
  // Fill an address from outside (e.g. "MIA" / "PortMiami" chips). Bump
  // `nonce` to apply the same value twice.
  preset?: { pickup?: string; destination?: string; nonce: number };
  // Custom arrangement of the two inputs and the map (used by the home
  // booking panel, which puts the map in its own column).
  renderLayout?: (parts: { pickupInput: React.ReactNode; dropoffInput: React.ReactNode; map: React.ReactNode }) => React.ReactNode;
  mapClassName?: string;
  compact?: boolean;
  pickupPlaceholder?: string;
  destinationPlaceholder?: string;
  // Look of the two address inputs (the home booking bar uses borderless cells).
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  labels?: { pickup: string; destination: string };
  // Shown when an address field is focused while empty.
  popularPlaces?: { label: string; address: string }[];
  routeColor?: string;
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

// Home booking map: quieter palette matching the brand (black / #191919).
const BRAND_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#171717' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6f6f6f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#171717' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#a3a3a3' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#262626' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#333333' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a3a3a' }] },
];

let googleMapsLoaderPromise: Promise<any> | null = null;
let googleMapsAuthFailed = false;
const MAPS_AUTH_FAILURE = 'expresslyft:maps-auth-failure';

function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  if (googleMapsAuthFailed) return Promise.reject(new Error('Maps authorization unavailable'));
  if ((window as any).google?.maps?.places) return Promise.resolve((window as any).google);
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      googleMapsAuthFailed = true;
      window.dispatchEvent(new Event(MAPS_AUTH_FAILURE));
      reject(new Error('Maps authorization unavailable'));
    };
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

export default function MapRouteSelector({ onRouteCalculated, initialPickup, initialDestination, preset, renderLayout, mapClassName, compact, pickupPlaceholder, destinationPlaceholder, inputClassName, inputStyle, labels, popularPlaces, routeColor = '#B8960C' }: MapRouteSelectorProps) {
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
  const [routeError, setRouteError] = useState<string | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupText, setPickupText] = useState(initialPickup || '');
  const [dropoffText, setDropoffText] = useState(initialDestination || '');
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);
  const [focusedField, setFocusedField] = useState<'pickup' | 'dropoff' | null>(null);
  const lastBoundsRef = useRef<any>(null);

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
    if (googleMapsAuthFailed || !input || input.trim().length < 3) return [];
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
    setPickupCoords(null);
    setRouteError(null);
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    pickupDebounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(value, pickupSessionTokenRef);
      setPickupSuggestions(results);
    }, 250);
  };

  const handleDropoffChange = (value: string) => {
    setDropoffText(value);
    setDropoffCoords(null);
    setRouteError(null);
    if (dropoffDebounceRef.current) clearTimeout(dropoffDebounceRef.current);
    dropoffDebounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(value, dropoffSessionTokenRef);
      setDropoffSuggestions(results);
    }, 250);
  };

  // Load SDK and initialize map + geocoder
  useEffect(() => {
    let cancelled = false;
    const unavailable = () => {
      if (cancelled) return;
      setIsLoaded(false);
      setMapError('Online route pricing is temporarily unavailable.');
    };
    window.addEventListener(MAPS_AUTH_FAILURE, unavailable);

    loadGoogleMaps()
      .then(async (google) => {
        if (cancelled || !mapContainerRef.current) return;

        await google.maps.importLibrary('geometry');
        if (cancelled || googleMapsAuthFailed) { unavailable(); return; }

        const map = new google.maps.Map(mapContainerRef.current, {
          center: MIAMI_CENTER,
          zoom: 10,
          styles: compact ? BRAND_MAP_STYLE : DARK_MAP_STYLE,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          // Compact (home) map: page scroll passes over it without Google's
          // "use ctrl + scroll to zoom" overlay.
          ...(compact ? { scrollwheel: false, zoomControl: false, cameraControl: false, rotateControl: false, keyboardShortcuts: false, clickableIcons: false, backgroundColor: '#111111' } : {}),
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
        unavailable();
      });

    return () => {
      cancelled = true;
      window.removeEventListener(MAPS_AUTH_FAILURE, unavailable);
    };
  }, []);

  // Turn a typed/handed-over address into coordinates (biased to South
  // Florida) so the route and price appear without using autocomplete.
  const resolveAddress = (address: string, apply: (c: { lat: number; lng: number }) => void) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode(
      { address, bounds: SOUTH_FLORIDA_BOUNDS, region: 'us' },
      (results: any, status: string) => {
        if (status !== 'OK' || !results?.[0]) return;
        const loc = results[0].geometry.location;
        apply({ lat: loc.lat(), lng: loc.lng() });
      }
    );
  };

  // Keep the route framed when the map container changes size (the home
  // booking bar reveals the map only once a route exists).
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current && lastBoundsRef.current && el.clientHeight > 50) {
        mapRef.current.fitBounds(lastBoundsRef.current, 40);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pickPopular = (address: string, isPickup: boolean) => {
    if (isPickup) {
      setPickupText(address);
      setPickupSuggestions([]);
      resolveAddress(address, setPickupCoords);
    } else {
      setDropoffText(address);
      setDropoffSuggestions([]);
      resolveAddress(address, setDropoffCoords);
    }
    setFocusedField(null);
  };

  // Addresses handed over from the corporate site (/book?pickup=…) — once.
  useEffect(() => {
    if (!isLoaded) return;
    if (initialPickup && !currentPickupCoords.current) resolveAddress(initialPickup, setPickupCoords);
    if (initialDestination && !currentDropoffCoords.current) resolveAddress(initialDestination, setDropoffCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Quick-fill from outside (service tab chips).
  useEffect(() => {
    if (!preset || !isLoaded) return;
    if (preset.pickup) {
      setPickupText(preset.pickup);
      setPickupSuggestions([]);
      resolveAddress(preset.pickup, setPickupCoords);
    }
    if (preset.destination) {
      setDropoffText(preset.destination);
      setDropoffSuggestions([]);
      resolveAddress(preset.destination, setDropoffCoords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.nonce, isLoaded]);

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
          icon: compact
            ? { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#0b0b0b', fillOpacity: 1, strokeColor: '#E9D5A6', strokeWeight: 3 }
            : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
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
          icon: compact
            ? {
                path: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
                fillColor: '#E9D5A6', fillOpacity: 1, strokeColor: '#0b0b0b', strokeWeight: 1,
                scale: 1.6, anchor: new google.maps.Point(12, 22),
              }
            : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
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
    // Clear the previous quote immediately when an address changes or a
    // route is being recalculated. A stale distance must never reach checkout.
    onRouteCalculatedRef.current({
      pickup: pickupTextRef.current,
      destination: dropoffTextRef.current,
      distanceMiles: 0,
      durationMinutes: 0,
    });
    if (!isLoaded || !pickupCoords || !dropoffCoords) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
      }
      return;
    }

    const google = (window as any).google;
    let cancelled = false;
    setRouteError(null);

    fetchRoute(pickupCoords, dropoffCoords)
      .then((route) => {
        if (cancelled) return;
        if (!route || !Number.isFinite(route.distanceMeters) || route.distanceMeters <= 0) {
          throw new Error('No driving route available');
        }

        const path = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);

        if (routePolylineRef.current) {
          routePolylineRef.current.setPath(path);
        } else {
          routePolylineRef.current = new google.maps.Polyline({
            path,
            map: mapRef.current,
            strokeColor: routeColor,
            strokeWeight: 5,
            strokeOpacity: 0.75,
          });
        }

        const bounds = new google.maps.LatLngBounds();
        path.forEach((p: any) => bounds.extend(p));
        lastBoundsRef.current = bounds;
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
        if (cancelled) return;
        console.error('Error fetching route', err);
        setRouteError('We could not calculate this route. Check the addresses or contact us for a quote.');
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

  const pickupInput = (
        <div className="relative">
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#BBBBBB' }}>
            {labels?.pickup || 'Pickup Location'}
          </label>
          <input
            type="text"
            aria-label={labels?.pickup || 'Pickup Location'}
            value={pickupText}
            placeholder={pickupPlaceholder || 'Pickup location (e.g., Miami Airport)'}
            className={inputClassName || "w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--gold)] placeholder-[var(--text-faint)]"}
            style={inputStyle || { background: 'var(--bg-alt)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
            onChange={(e) => handlePickupChange(e.target.value)}
            onFocus={() => { if (pickupBlurTimeoutRef.current) clearTimeout(pickupBlurTimeoutRef.current); setFocusedField('pickup'); }}
            onBlur={() => { pickupBlurTimeoutRef.current = setTimeout(() => { setPickupSuggestions([]); setFocusedField((f) => (f === 'pickup' ? null : f)); }, 150); }}
          />
          {popularPlaces && focusedField === 'pickup' && !pickupText.trim() && pickupSuggestions.length === 0 && (
            <div className={suggestionDropdownClass} style={suggestionDropdownStyle}>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Popular</div>
              {popularPlaces.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickPopular(p.address, true)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                  style={{ color: 'var(--text)', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {pickupSuggestions.length > 0 && (
            <div className={suggestionDropdownClass} style={suggestionDropdownStyle}>
              {pickupSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s, true)}
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
          {!compact && (<p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Green marker (click map or drag to set)
          </p>)}
        </div>
  );

  const dropoffInput = (
        <div className="relative">
          <label className="text-sm font-semibold mb-2 block" style={{ color: '#BBBBBB' }}>
            {labels?.destination || 'Destination'}
          </label>
          <input
            type="text"
            aria-label={labels?.destination || 'Destination'}
            value={dropoffText}
            placeholder={destinationPlaceholder || 'Destination (e.g., B Ocean Resort)'}
            className={inputClassName || "w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--gold)] placeholder-[var(--text-faint)]"}
            style={inputStyle || { background: 'var(--bg-alt)', border: '1px solid var(--border-soft)', color: 'var(--text)' }}
            onChange={(e) => handleDropoffChange(e.target.value)}
            onFocus={() => { if (dropoffBlurTimeoutRef.current) clearTimeout(dropoffBlurTimeoutRef.current); setFocusedField('dropoff'); }}
            onBlur={() => { dropoffBlurTimeoutRef.current = setTimeout(() => { setDropoffSuggestions([]); setFocusedField((f) => (f === 'dropoff' ? null : f)); }, 150); }}
          />
          {popularPlaces && focusedField === 'dropoff' && !dropoffText.trim() && dropoffSuggestions.length === 0 && (
            <div className={suggestionDropdownClass} style={suggestionDropdownStyle}>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Popular</div>
              {popularPlaces.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickPopular(p.address, false)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--border)] transition-colors"
                  style={{ color: 'var(--text)', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {dropoffSuggestions.length > 0 && (
            <div className={suggestionDropdownClass} style={suggestionDropdownStyle}>
              {dropoffSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s, false)}
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
          {!compact && (<p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Red marker (click map or drag to set)
          </p>)}
        </div>
  );

  const map = (
    <>
      <div
        ref={mapContainerRef}
        style={mapError ? { display: 'none' } : undefined}
        className={mapClassName || 'w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-[var(--border-soft)] cursor-pointer'}
        title="Click anywhere on the map to set a location, or drag the markers"
      />
      {mapError && (
        <div className="h-full min-h-[150px] flex flex-col justify-center gap-2 p-4 rounded-xl bg-[#171717] text-white" role="status">
          <p className="text-sm font-semibold">{mapError}</p>
          <p className="text-xs text-white/70">Our team can help you plan your ride.</p>
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <a href={CONTACT.phoneHref} className="underline text-[var(--gold-light)]">Call {CONTACT.phoneDisplay}</a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="underline text-[var(--gold-light)]">WhatsApp</a>
          </div>
        </div>
      )}
      {routeError && <p className="text-sm text-red-400 p-3" role="status">{routeError}</p>}
    </>
  );

  if (renderLayout) return <>{renderLayout({ pickupInput, dropoffInput, map })}</>;

  return (
    <div className="flex flex-col gap-4">
      {/* Address inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pickupInput}
        {dropoffInput}
      </div>

      {/* Map Container */}
      {map}
    </div>
  );
}
