import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getCoordinates = (postcode) => {
  // Simplified postcode-to-coordinate mapping using hash
  const hash = postcode.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
  const lat = 53.5 + (Math.abs(hash % 1000) / 1000) * 0.3;
  const lon = -2.5 + (Math.abs(hash % 500) / 500) * 0.2;
  return [lat, lon];
};

const getColorByDensity = (canvassedCount, totalCount, canvassed) => {
  if (totalCount === 0) return '#e5e7eb';
  
  const percentage = (canvassedCount / totalCount) * 100;
  
  if (canvassed) {
    // Canvassed: green scale
    if (percentage >= 80) return '#059669'; // Dark green
    if (percentage >= 60) return '#10b981'; // Green
    if (percentage >= 40) return '#34d399'; // Light green
    if (percentage >= 20) return '#6ee7b7'; // Lighter green
    return '#d1fae5'; // Very light green
  } else {
    // Non-canvassed: red scale
    if (percentage >= 80) return '#dc2626'; // Dark red
    if (percentage >= 60) return '#ef4444'; // Red
    if (percentage >= 40) return '#f87171'; // Light red
    if (percentage >= 20) return '#fca5a5'; // Lighter red
    return '#fee2e2'; // Very light red
  }
};

export default function CanvassingCoverageMap({ contacts }) {
  // Group contacts by postcode sector
  const postcodeData = useMemo(() => {
    const groups = {};

    contacts.forEach(contact => {
      if (!contact.postcode) return;
      
      // Extract postcode sector (first 4 chars, e.g., "OL2 " from "OL2 6XX")
      const sector = contact.postcode.substring(0, 4).toUpperCase();
      
      if (!groups[sector]) {
        groups[sector] = {
          sector,
          canvassed: 0,
          notCanvassed: 0,
          coordinates: getCoordinates(sector),
          contacts: [],
        };
      }
      
      groups[sector].contacts.push(contact);
      if (contact.canvassed) {
        groups[sector].canvassed++;
      } else {
        groups[sector].notCanvassed++;
      }
    });

    return Object.values(groups);
  }, [contacts]);

  const mapCenter = useMemo(() => {
    if (postcodeData.length === 0) return [53.5, -2.5];
    const avgLat = postcodeData.reduce((sum, d) => sum + d.coordinates[0], 0) / postcodeData.length;
    const avgLon = postcodeData.reduce((sum, d) => sum + d.coordinates[1], 0) / postcodeData.length;
    return [avgLat, avgLon];
  }, [postcodeData]);

  if (postcodeData.length === 0) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No contact data to display</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Canvassed areas */}
        {postcodeData.map(sector => (
          <CircleMarker
            key={`canvassed-${sector.sector}`}
            center={sector.coordinates}
            radius={8 + (sector.canvassed / (sector.canvassed + sector.notCanvassed)) * 12}
            fillColor={getColorByDensity(sector.canvassed, sector.canvassed + sector.notCanvassed, true)}
            fillOpacity={0.7}
            stroke={true}
            color="#ffffff"
            weight={2}
          >
            <Tooltip>
              <div className="text-sm">
                <p className="font-bold">{sector.sector} (Canvassed)</p>
                <p>Visited: {sector.canvassed}</p>
                <p>Not visited: {sector.notCanvassed}</p>
                <p className="mt-1 font-semibold">
                  {Math.round((sector.canvassed / (sector.canvassed + sector.notCanvassed)) * 100)}% coverage
                </p>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Non-canvassed areas overlay */}
        {postcodeData.map(sector => (
          sector.notCanvassed > 0 && (
            <CircleMarker
              key={`not-canvassed-${sector.sector}`}
              center={[sector.coordinates[0] + 0.001, sector.coordinates[1] + 0.001]}
              radius={4 + (sector.notCanvassed / (sector.canvassed + sector.notCanvassed)) * 8}
              fillColor={getColorByDensity(sector.notCanvassed, sector.canvassed + sector.notCanvassed, false)}
              fillOpacity={0.5}
              stroke={true}
              color="#ffffff"
              weight={1}
              dashArray="3,3"
            >
              <Tooltip>
                <div className="text-sm">
                  <p className="font-bold">{sector.sector} (Not Canvassed)</p>
                  <p>Not visited: {sector.notCanvassed}</p>
                  <p className="mt-1">Priority area</p>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs z-10">
        <p className="font-semibold mb-2">Coverage Density</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#059669' }}></div>
            <span>80%+ canvassed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span>60-80% canvassed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#34d399' }}></div>
            <span>40-60% canvassed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span>Priority (not canvassed)</span>
          </div>
        </div>
      </div>
    </div>
  );
}