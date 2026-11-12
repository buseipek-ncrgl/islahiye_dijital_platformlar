import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RotateCcw, MapPin, CheckCircle2 } from 'lucide-react';
import islahiyeDistrictBoundaryGeojson from '../../../data/geo/islahiye-district.json';
import {
  ISLAHIYE_TOWN_CENTER,
  ISLAHIYE_MAX_BOUNDS,
} from './AdminRealMapView';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChangeCoordinates: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  lat,
  lng,
  onChangeCoordinates,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChangeCoordinates);

  useEffect(() => {
    onChangeRef.current = onChangeCoordinates;
  }, [onChangeCoordinates]);

  // Initialize mini Leaflet picker map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const initialLat = typeof lat === 'number' && !isNaN(lat) ? lat : ISLAHIYE_TOWN_CENTER[0];
      const initialLng = typeof lng === 'number' && !isNaN(lng) ? lng : ISLAHIYE_TOWN_CENTER[1];

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: ISLAHIYE_MAX_BOUNDS,
        maxBoundsViscosity: 0.8,
        zoomControl: true,
      });

      // OSM tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // District boundary
      try {
        const rawCoords = islahiyeDistrictBoundaryGeojson.features[0].geometry.coordinates[0] as [
          number,
          number
        ][];
        const islahiyeLatLngs: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);

        L.polyline(islahiyeLatLngs, {
          color: '#059669',
          weight: 2,
          dashArray: '5, 4',
          interactive: false,
        }).addTo(map);
      } catch (e) {
        console.warn('Sınır yüklenemedi:', e);
      }

      // Custom draggable pin
      const pinIcon = L.divIcon({
        className: 'picker-pin',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:grab;">
            <div style="
              width: 32px;
              height: 32px;
              background: #059669;
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({
          lat: parseFloat(pos.lat.toFixed(5)),
          lng: parseFloat(pos.lng.toFixed(5)),
        });
      });

      markerRef.current = marker;

      // Click on map to place pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(5));
        const clickedLng = parseFloat(e.latlng.lng.toFixed(5));
        marker.setLatLng([clickedLat, clickedLng]);
        onChangeRef.current({ lat: clickedLat, lng: clickedLng });
      });

      mapInstanceRef.current = map;

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      return () => {
        clearTimeout(timer);
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err) {
      console.error('Picker harita başlatılamadı:', err);
    }
  }, []);

  // Update marker position when lat/lng change from outside (e.g. text inputs)
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

    const currentPos = markerRef.current.getLatLng();
    if (
      Math.abs(currentPos.lat - lat) > 0.0001 ||
      Math.abs(currentPos.lng - lng) > 0.0001
    ) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng]);

  const handleResetToCenter = () => {
    if (!markerRef.current || !mapInstanceRef.current) return;
    const [cLat, cLng] = ISLAHIYE_TOWN_CENTER;
    markerRef.current.setLatLng([cLat, cLng]);
    mapInstanceRef.current.setView([cLat, cLng], 14, { animate: true });
    onChangeCoordinates({ lat: cLat, lng: cLng });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Etkileşimli Konum Seçici (Haritaya tıklayın veya pini sürükleyin)</span>
        </span>
        <button
          type="button"
          onClick={handleResetToCenter}
          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>İslahiye Merkezine Sıfırla</span>
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner h-64 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-sans font-medium text-slate-700 shadow-xs flex items-center gap-1.5 tabular-nums">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Seçili: {lat?.toFixed(5) || 0}, {lng?.toFixed(5) || 0}</span>
        </div>
      </div>
    </div>
  );
};
