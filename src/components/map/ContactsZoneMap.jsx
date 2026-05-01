import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Support level color mapping
const SUPPORT_COLORS = {
  strong_supporter: '#16a34a',
  leaning: '#0ea5e9',
  undecided: '#f59e0b',
  opposed: '#ef4444',
  unknown: '#9ca3af',
};

export default function ContactsZoneMap({ contacts, route = null, selectedIds = new Set() }) {
  // Calculate center point from all contacts with coordinates
  const centerCoords = useMemo(() => {
    const validContacts = contacts.filter(c => {
      if (route) {
        return route.some(r => r.contact.id === c.id);
      }
      return true;
    });

    if (validContacts.length === 0) return [53.481, -2.234]; // Default to UK center

    const lats = validContacts.map(c => {
      const routeStop = route?.find(r => r.contact.id === c.id);
      return routeStop?.coords?.[0] || null;
    }).filter(Boolean);

    const lons = validContacts.map(c => {
      const routeStop = route?.find(r => r.contact.id === c.id);
      return routeStop?.coords?.[1] || null;
    }).filter(Boolean);

    if (lats.length === 0 || lons.length === 0) return [53.481, -2.234];

    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLon = lons.reduce((a, b) => a + b, 0) / lons.length;
    return [avgLat, avgLon];
  }, [contacts, route]);

  // Get route polyline coordinates
  const routePolyline = useMemo(() => {
    if (!route) return null;
    return route
      .filter(s => s.coords)
      .map(s => [s.coords[0], s.coords[1]]);
  }, [route]);

  // Create custom icons for different stop types
  const getMarkerIcon = (contact, isInRoute, stopNumber) => {
    const color = SUPPORT_COLORS[contact.support_level] || SUPPORT_COLORS.unknown;
    
    if (isInRoute) {
      // Route stop marker with number
      return L.divIcon({
        html: `<div style="background: ${color}; color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${stopNumber}</div>`,
        iconSize: [32, 32],
        className: 'custom-marker',
      });
    }

    // Regular contact marker
    return L.divIcon({
      html: `<div style="background: ${color}; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      className: 'custom-marker',
    });
  };

  return (
    <MapContainer
      center={centerCoords}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Route polyline */}
      {routePolyline && routePolyline.length > 1 && (
        <Polyline
          positions={routePolyline}
          color="#1669a7"
          weight={3}
          opacity={0.7}
          dashArray="5, 5"
        />
      )}

      {/* Markers */}
      {(route || contacts).map((item, idx) => {
        const contact = route ? item.contact : item;
        const coords = route ? item.coords : null;

        if (!coords && !route) {
          // For non-route display, skip contacts without coordinates
          return null;
        }

        const stopNumber = route ? idx + 1 : null;
        const isInRoute = route && route.some(r => r.contact.id === contact.id);

        if (!coords && !isInRoute) return null;

        const [lat, lon] = coords || [null, null];
        if (!lat || !lon) return null;

        const supportLabel = {
          strong_supporter: '✓ Strong',
          leaning: '~ Leaning',
          undecided: '? Undecided',
          opposed: '✗ Opposed',
          unknown: '○ Unknown',
        }[contact.support_level] || 'Unknown';

        return (
          <Marker
            key={contact.id}
            position={[lat, lon]}
            icon={getMarkerIcon(contact, isInRoute, stopNumber)}
          >
            <Popup className="leaflet-popup-content-custom">
              <div className="text-sm">
                {stopNumber && (
                  <div className="font-bold text-base mb-1">Stop {stopNumber}</div>
                )}
                <div className="font-medium">{contact.name}</div>
                <div className="text-xs text-gray-600 mt-1">{contact.address}</div>
                {contact.postcode && (
                  <div className="text-xs font-mono text-gray-600">{contact.postcode}</div>
                )}
                <div className="mt-2 text-xs">
                  <span
                    className="inline-block px-2 py-1 rounded text-white"
                    style={{ backgroundColor: SUPPORT_COLORS[contact.support_level] || SUPPORT_COLORS.unknown }}
                  >
                    {supportLabel}
                  </span>
                </div>
                {contact.phone && (
                  <div className="text-xs text-gray-600 mt-1">📞 {contact.phone}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs z-40 max-w-xs">
        <div className="font-semibold mb-2">Support Level</div>
        <div className="space-y-1">
          {Object.entries(SUPPORT_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">
                {level.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
        {route && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-700" />
              <span>Optimized route</span>
            </div>
          </div>
        )}
      </div>
    </MapContainer>
  );
}