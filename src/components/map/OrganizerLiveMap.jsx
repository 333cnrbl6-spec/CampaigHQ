import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Zap, AlertCircle } from 'lucide-react';

export default function OrganizerLiveMap({ volunteers = [], turfs = [], loading = false }) {
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [mapCenter, setMapCenter] = useState([53.4808, -2.2426]); // Default: UK center
  const mapRef = useRef(null);

  // Calculate map bounds from volunteer locations
  useEffect(() => {
    if (volunteers.length > 0 && mapRef.current) {
      const group = L.featureGroup();
      volunteers.forEach(vol => {
        group.addLayer(L.marker([vol.latitude, vol.longitude]));
      });

      // Also add turf boundaries
      turfs.forEach(turf => {
        if (turf.geojson) {
          try {
            const geoData = JSON.parse(turf.geojson);
            group.addLayer(L.geoJSON(geoData));
          } catch (e) {
            console.error('Invalid GeoJSON for turf:', turf.turf_name);
          }
        }
      });

      if (group.getLayers().length > 0) {
        mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    }
  }, [volunteers, turfs]);

  // Custom marker icons
  const activeMarkerIcon = L.divIcon({
    className: 'leaflet-div-icon',
    html: `<div class="w-6 h-6 bg-green-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
      <span class="text-white text-xs">👤</span>
    </div>`,
    iconSize: [24, 24],
  });

  const idleMarkerIcon = L.divIcon({
    className: 'leaflet-div-icon',
    html: `<div class="w-6 h-6 bg-amber-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
      <span class="text-white text-xs">⏸️</span>
    </div>`,
    iconSize: [24, 24],
  });

  const turfStyle = (turf) => {
    const completion = turf.completion_percentage;
    let color = '#ccc'; // Not started
    
    if (completion >= 100) color = '#10b981'; // Completed
    else if (completion >= 50) color = '#f59e0b'; // Half way
    else if (completion > 0) color = '#3b82f6'; // Started

    return {
      color,
      weight: 2,
      opacity: 0.6,
      fillOpacity: 0.3,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Active Volunteers</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{volunteers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Turfs In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {turfs.filter(t => t.completion_percentage > 0 && t.completion_percentage < 100).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {turfs.filter(t => t.completion_percentage === 100).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {turfs.length > 0 ? Math.round((turfs.reduce((sum, t) => sum + t.completion_percentage, 0) / turfs.length)) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-96 lg:h-[600px]">
        {/* Live Map */}
        <Card className="lg:col-span-3 overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="w-full h-full z-0"
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* Turf Boundaries */}
            {turfs.map(turf => {
              if (!turf.geojson) return null;
              
              try {
                const geoData = JSON.parse(turf.geojson);
                return (
                  <GeoJSON
                    key={turf.turf_id}
                    data={geoData}
                    style={turfStyle(turf)}
                    onEachFeature={(feature, layer) => {
                      layer.bindPopup(`
                        <div class="p-2">
                          <p class="font-bold">${turf.turf_name}</p>
                          <p class="text-sm">${turf.doors_knocked}/${turf.target_doors} doors</p>
                          <div class="w-full bg-gray-200 rounded h-2 mt-1">
                            <div class="bg-green-500 h-2 rounded" style="width: ${turf.completion_percentage}%"></div>
                          </div>
                          <p class="text-xs mt-1">${turf.completion_percentage}% complete</p>
                        </div>
                      `);
                    }}
                  />
                );
              } catch (e) {
                return null;
              }
            })}

            {/* Volunteer Markers */}
            {volunteers.map(vol => (
              <Marker
                key={vol.id}
                position={[vol.latitude, vol.longitude]}
                icon={vol.status === 'active' ? activeMarkerIcon : idleMarkerIcon}
                eventHandlers={{
                  click: () => setSelectedVolunteer(vol),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <div className="text-sm">
                    <p className="font-semibold">{vol.name}</p>
                    <p className="text-xs">{vol.doors_knocked_today} doors today</p>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-2 text-sm space-y-1">
                    <p className="font-bold">{vol.name}</p>
                    <p className="text-xs text-muted-foreground">{vol.email}</p>
                    <p className="text-xs">📍 {vol.postcode}</p>
                    <p className="text-xs">🎯 {vol.turf_name}</p>
                    <p className="text-xs">👥 Team: {vol.team_lead}</p>
                    <p className="text-xs">🚪 Doors today: {vol.doors_knocked_today}</p>
                    <p className="text-xs">🔋 Battery: {vol.battery_level}%</p>
                    <p className="text-xs text-muted-foreground">Last update: {new Date(vol.last_updated).toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>

        {/* Sidebar: Active Volunteers */}
        <Card className="overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Now ({volunteers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {volunteers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active canvassers</p>
            ) : (
              volunteers.map(vol => (
                <div
                  key={vol.id}
                  onClick={() => setSelectedVolunteer(vol)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVolunteer?.id === vol.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{vol.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{vol.turf_name}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {vol.doors_knocked_today} doors
                        </Badge>
                        {vol.battery_level < 20 && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {vol.battery_level}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      {vol.status === 'active' ? (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      ) : (
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Turf Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Turf Completion Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {turfs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No turfs available</p>
          ) : (
            turfs.slice(0, 8).map(turf => (
              <div key={turf.turf_id} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <p className="font-medium truncate">{turf.turf_name}</p>
                  <Badge
                    variant={turf.completion_percentage === 100 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {turf.completion_percentage}%
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      turf.completion_percentage === 100
                        ? 'bg-green-600'
                        : turf.completion_percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${turf.completion_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {turf.doors_knocked} / {turf.target_doors} doors
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}