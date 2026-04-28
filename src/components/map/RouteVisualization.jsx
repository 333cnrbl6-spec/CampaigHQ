import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons for start, end, and waypoints
const startIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5IiBmaWxsPSIjMTZhMzRhIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const endIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI5IiBmaWxsPSIjZGMyNjI2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const waypointIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI2IiBmaWxsPSIjZjU5ZTBiIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function RouteVisualization({ route, getCoords }) {
  const mapCenter = useMemo(() => {
    if (route.length === 0) return [53.5, -2.5];
    const coords = route.map(c => getCoords(c.postcode || ''));
    const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const avgLon = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    return [avgLat, avgLon];
  }, [route, getCoords]);

  const polylineCoords = useMemo(() => {
    return route.map(contact => getCoords(contact.postcode || ''));
  }, [route, getCoords]);

  if (route.length === 0) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No route to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>'
        />

        {/* Route polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            color="#16a34a"
            weight={3}
            opacity={0.7}
            dashArray="5, 5"
          />
        )}

        {/* Markers */}
        {route.map((contact, idx) => {
          const coords = getCoords(contact.postcode || '');
          const isStart = idx === 0;
          const isEnd = idx === route.length - 1;

          return (
            <Marker
              key={contact.id}
              position={coords}
              icon={isStart ? startIcon : isEnd ? endIcon : waypointIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">Stop {idx + 1}</p>
                  <p>{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.address}</p>
                  <p className="text-xs text-muted-foreground">{contact.postcode}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Distance circles for waypoints */}
        {route.map((contact, idx) => {
          if (idx === 0 || idx === route.length - 1) return null;
          const coords = getCoords(contact.postcode || '');
          return (
            <CircleMarker
              key={`circle-${contact.id}`}
              center={coords}
              radius={4}
              fillColor="#f59e0b"
              fillOpacity={0.2}
              stroke={false}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}