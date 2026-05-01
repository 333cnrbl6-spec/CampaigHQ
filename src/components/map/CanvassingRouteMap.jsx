import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a numbered circle marker icon
function numberedIcon(num, isStart, isEnd) {
  const bg = isStart ? '#16a34a' : isEnd ? '#dc2626' : '#2563eb';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${bg}" stroke="white" stroke-width="2.5"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="${num > 9 ? '11' : '13'}" font-weight="bold" font-family="sans-serif">${num}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// Auto-fit map bounds to route
function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

export default function CanvassingRouteMap({ route }) {
  const coords = useMemo(() => route.map(s => s.coords), [route]);

  const center = useMemo(() => {
    if (coords.length === 0) return [53.515, -2.454];
    const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const lon = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [lat, lon];
  }, [coords]);

  if (route.length === 0) return null;

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>'
      />

      <FitBounds coords={coords} />

      {/* Route polyline */}
      {coords.length > 1 && (
        <Polyline
          positions={coords}
          color="#2563eb"
          weight={3}
          opacity={0.75}
          dashArray="8, 6"
        />
      )}

      {/* Numbered markers */}
      {route.map((stop, idx) => (
        <Marker
          key={stop.contact.id}
          position={stop.coords}
          icon={numberedIcon(idx + 1, idx === 0, idx === route.length - 1)}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-bold text-base mb-1">Stop {idx + 1}</p>
              <p className="font-semibold">{stop.contact.name}</p>
              {stop.contact.address && <p className="text-gray-600 text-xs mt-0.5">{stop.contact.address}</p>}
              {stop.contact.postcode && <p className="text-gray-500 text-xs">{stop.contact.postcode}</p>}
              {stop.contact.tags?.length > 0 && (
                <p className="text-blue-600 text-xs mt-1">{stop.contact.tags.join(', ')}</p>
              )}
              {stop.contact.support_level && stop.contact.support_level !== 'unknown' && (
                <p className="text-gray-500 text-xs mt-0.5 capitalize">{stop.contact.support_level.replace(/_/g, ' ')}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}