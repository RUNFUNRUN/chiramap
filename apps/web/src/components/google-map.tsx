'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState } from 'react';

type GoogleMapProps = {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markerPosition?: { lat: number; lng: number };
};

const createBlueDot = () => {
  const container = document.createElement('div');
  container.className = 'relative flex items-center justify-center';

  const halo = document.createElement('div');
  halo.className = 'absolute w-8 h-8 bg-blue-500/20 rounded-full animate-pulse';

  const dot = document.createElement('div');
  dot.className =
    'relative w-4 h-4 bg-blue-500 border-[3px] border-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.15)]';

  container.appendChild(halo);
  container.appendChild(dot);
  return container;
};

const GoogleMap = ({
  apiKey,
  center = { lat: 35.6812, lng: 139.7671 }, // Tokyo Station
  zoom = 15,
  markerPosition,
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const initialized = useRef(false);

  // Initialize Map only once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initMap = async () => {
      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries: ['marker'],
      });

      const { Map: GoogleMapLibrary } = await importLibrary('maps');
      const { AdvancedMarkerElement } = await importLibrary('marker');

      if (mapRef.current) {
        const mapInstance = new GoogleMapLibrary(mapRef.current, {
          center,
          zoom,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          clickableIcons: false,
        });

        setMap(mapInstance);

        // Initial marker
        if (markerPosition) {
          const newMarker = new AdvancedMarkerElement({
            map: mapInstance,
            position: markerPosition,
            content: createBlueDot(),
          });
          setMarker(newMarker);
        }
      }
    };

    initMap();
  }, [apiKey, center, markerPosition, zoom]);

  // Update marker position
  useEffect(() => {
    if (marker && markerPosition) {
      marker.position = markerPosition;
    } else if (map && markerPosition && !marker) {
      // Create marker if it wasn't created during init (e.g. started without position)
      importLibrary('marker').then(({ AdvancedMarkerElement }) => {
        const newMarker = new AdvancedMarkerElement({
          map,
          position: markerPosition,
          content: createBlueDot(),
        });
        setMarker(newMarker);
      });
    }
  }, [marker, markerPosition, map]);

  // Update map center/pan
  useEffect(() => {
    if (map && center) {
      // Only pan if the distance is significant to avoid jitter or conflict with user interaction?
      // For this app (tracking), we probably want to follow.
      map.panTo(center);
    }
  }, [map, center]);

  return <div ref={mapRef} className='h-full w-full min-h-[400px]' />;
};

export default GoogleMap;
