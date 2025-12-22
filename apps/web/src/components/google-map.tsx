'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState } from 'react';

type GoogleMapProps = {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markerPosition?: { lat: number; lng: number };
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

  useEffect(() => {
    const initMap = async () => {
      // Configure the loader globally with the API key and other options
      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries: ['marker'], // Required for AdvancedMarkerElement
      });

      // Now, import libraries directly using the functional API
      const { Map: GoogleMapLibrary } = await importLibrary('maps');
      const { AdvancedMarkerElement } = await importLibrary('marker');

      if (mapRef.current) {
        const mapInstance = new GoogleMapLibrary(mapRef.current, {
          center,
          zoom,
          mapId: 'DEMO_MAP_ID', // Required for Advanced Markers, replace with real ID for production
          disableDefaultUI: true, // Keep it simple
          clickableIcons: false, // Reduce noise
        });

        setMap(mapInstance);

        if (markerPosition) {
          const newMarker = new AdvancedMarkerElement({
            map: mapInstance,
            position: markerPosition,
          });
          setMarker(newMarker);
        }
      }
    };

    initMap();
  }, [apiKey, center, markerPosition, zoom]); // Run once on mount (technically when apiKey changes, but it's stable)

  // Update marker position when prop changes
  useEffect(() => {
    if (marker && markerPosition) {
      marker.position = markerPosition;
    }
    if (map && markerPosition) {
      map.panTo(markerPosition);
    }
  }, [marker, markerPosition, map]);

  return <div ref={mapRef} className='h-full w-full min-h-[400px]' />;
};

export default GoogleMap;
