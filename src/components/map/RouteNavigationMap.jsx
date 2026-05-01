import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leafapi/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RouteNavigationMap({ route, currentStopIndex, userLocation }) {
  const mapRef = useRef();

  if (!route || route.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No route to display</p>
      </div>
    );
  }

  const stops = route.filter(s => s.coords);
  if (stops.length < 2) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Not enough location data</p>
      </div>
    );
  }

  // Calculate bounds
  const allLats = stops.map(s => s.coords[0]);
  const allLons = stops.map(s => s.coords[1]);
  if (userLocation) {
    allLats.push(userLocation[0]);
    allLons.push(userLocation[1]);
  }
  const bounds = [
    [Math.min(...allLats) - 0.002, Math.min(...allLons) - 0.002],
    [Math.max(...allLats) + 0.002, Math.max(...allLons) + 0.002],
  ];

  const currentStop = route[currentStopIndex];
  const currentCoords = currentStop?.coords || stops[0]?.coords;

  return (
    <MapContainer
      bounds={bounds}
      className="w-full h-full z-0"
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* Route polyline */}
      <Polyline
        positions={stops.map(s => [s.coords[0], s.coords[1]])}
        color="#2d5016"
        weight={3}
        opacity={0.6}
        dashArray="5,5"
      />

      {/* Future stops (after current) */}
      {stops.map((stop, idx) => {
        if (idx <= currentStopIndex) return null;
        return (
          <Marker
            key={stop.contact.id}
            position={[stop.coords[0], stop.coords[1]]}
            icon={L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })}
          >
            <Popup className="text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Stop {idx + 1}</p>
                <p className="font-medium">{stop.contact.name}</p>
                <p className="text-muted-foreground">{stop.contact.address}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Current stop (highlighted) */}
      {currentCoords && (
        <CircleMarker
          center={[currentCoords[0], currentCoords[1]]}
          radius={20}
          fillColor="#2d5016"
          color="#ffffff"
          weight={3}
          opacity={0.9}
          fillOpacity={0.8}
        >
          <Popup className="text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Current Stop (#{currentStopIndex + 1})</p>
              <p className="font-medium">{currentStop?.contact.name}</p>
              <p className="text-muted-foreground">{currentStop?.contact.address}</p>
            </div>
          </Popup>
        </CircleMarker>
      )}

      {/* User location (blue dot) */}
      {userLocation && (
        <CircleMarker
          center={[userLocation[0], userLocation[1]]}
          radius={8}
          fillColor="#3b82f6"
          color="#ffffff"
          weight={2}
          opacity={0.95}
          fillOpacity={0.8}
        >
          <Popup className="text-xs">Your Location</Popup>
        </CircleMarker>
      )}

      {/* Completed stops (grayed out) */}
      {stops.map((stop, idx) => {
        if (idx >= currentStopIndex) return null;
        return (
          <Marker
            key={stop.contact.id}
            position={[stop.coords[0], stop.coords[1]]}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNSA0MSI+PHBhdGggZmlsbD0iIzkyOWI5YiIgZD0iTTEyLjUgMEM0LjU0IDAgMCA3Ljc5IDAgMTcuNWMwIDkuNzEgMTIuNSAyMy41IDEyLjUgMjMuNXMxMi41LTEzLjc5IDEyLjUtMjMuNUMyNSA3Ljc5IDIwLjQ2IDAgMTIuNSAweiIvPjwvc3ZnPg==',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })}
          >
            <Popup className="text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm text-muted-foreground">Completed: Stop {idx + 1}</p>
                <p className="font-medium">{stop.contact.name}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}