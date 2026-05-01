import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';

const DEFAULT_CENTER = [53.5, -2.5]; // UK default
const DEFAULT_ZOOM = 13;

const TURF_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'
];

export default function TurfBoundaryMap({ turfs = [], contacts = [], onTurfClick = null, highlightAssigned = true }) {
  // Calculate bounds and center
  const mapCenter = useMemo(() => {
    if (!turfs.length) return DEFAULT_CENTER;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    turfs.forEach(turf => {
      if (turf.geojson) {
        try {
          const geom = JSON.parse(turf.geojson);
          const coords = geom.coordinates?.[0] || [];
          coords.forEach(([lng, lat]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          });
        } catch (e) {
          console.error('Error parsing geojson for turf:', turf.name);
        }
      }
    });

    if (minLat === Infinity) return DEFAULT_CENTER;
    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
  }, [turfs]);

  // Map turf IDs to assigned status
  const turfAssignmentMap = useMemo(() => {
    const map = {};
    turfs.forEach(turf => {
      map[turf.id] = {
        name: turf.name,
        assigned_to: turf.assigned_to,
        status: turf.status,
        contact_count: turf.contact_count || 0,
        assigned_team: turf.assigned_team || [],
      };
    });
    return map;
  }, [turfs]);

  // Map contacts by turf tags
  const contactsByTurf = useMemo(() => {
    const map = {};
    contacts.forEach(contact => {
      (contact.tags || []).forEach(tag => {
        if (!map[tag]) map[tag] = [];
        map[tag].push(contact);
      });
    });
    return map;
  }, [contacts]);

  // Handle GeoJSON feature rendering
  const onEachFeature = (feature, layer) => {
    const turfId = feature.properties?.id;
    const turf = turfAssignmentMap[turfId];

    if (turf) {
      // Create popup content
      const contactCount = contactsByTurf[turf.name]?.length || 0;
      const popupContent = (
        <div className="text-sm space-y-1">
          <p className="font-semibold">{turf.name}</p>
          <p className="text-xs text-muted-foreground">
            Status: <span className="font-medium capitalize">{turf.status}</span>
          </p>
          {turf.assigned_to ? (
            <p className="text-xs text-green-700">✓ Assigned to: {turf.assigned_to}</p>
          ) : (
            <p className="text-xs text-amber-700">⚠ Unassigned</p>
          )}
          {contactCount > 0 && (
            <p className="text-xs text-muted-foreground">{contactCount} contacts</p>
          )}
        </div>
      );

      layer.bindPopup(L.popup({ maxWidth: 250 }).setContent(popupContent));
      layer.bindTooltip(turf.name, { sticky: true, offset: [0, 10] });

      // Handle click
      if (onTurfClick) {
        layer.on('click', () => onTurfClick(turf));
      }
    }

    // Update layer styling on add
    layer.on('add', function() {
      updateLayerStyle(this);
    });
  };

  // Style each turf zone
  const updateLayerStyle = (layer) => {
    const feature = layer.feature;
    const turfId = feature.properties?.id;
    const turf = turfAssignmentMap[turfId];

    const isAssigned = turf?.assigned_to || (turf?.assigned_team && turf.assigned_team.length > 0);
    const color = turf ? TURF_COLORS[Object.keys(turfAssignmentMap).indexOf(turfId) % TURF_COLORS.length] : '#e5e7eb';
    const opacity = highlightAssigned && !isAssigned ? 0.3 : 0.6;
    const weight = isAssigned ? 2 : 1;

    layer.setStyle({
      fillColor: color,
      fillOpacity: opacity,
      color: color,
      weight: weight,
      dashArray: !isAssigned ? '5, 5' : undefined,
    });
  };

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Render turf boundaries */}
        {turfs.map((turf) => {
          if (!turf.geojson) return null;
          try {
            const geom = JSON.parse(turf.geojson);
            const isAssigned = turf.assigned_to || (turf.assigned_team && turf.assigned_team.length > 0);
            
            return (
              <GeoJSON
                key={turf.id}
                data={geom}
                onEachFeature={(feature, layer) => {
                  // Attach turf info to feature
                  feature.properties = { ...feature.properties, id: turf.id };
                  onEachFeature(feature, layer);
                }}
              />
            );
          } catch (e) {
            console.error('Error rendering turf:', turf.name, e);
            return null;
          }
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 text-sm space-y-2 z-10 max-w-xs">
        <p className="font-semibold text-xs uppercase text-muted-foreground">Turf Zones</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded opacity-60 border border-green-600"></div>
            <span className="text-xs">Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded opacity-30 border border-gray-500" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px)' }}></div>
            <span className="text-xs">Unassigned (low visibility)</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="border-t border-border pt-2 mt-2">
          <p className="text-xs text-muted-foreground">
            <strong>{turfs.filter(t => t.assigned_to || (t.assigned_team?.length > 0)).length}</strong> assigned · 
            <strong className="ml-1">{turfs.filter(t => !t.assigned_to && (!t.assigned_team || t.assigned_team.length === 0)).length}</strong> unassigned
          </p>
        </div>
      </div>
    </div>
  );
}