import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Users, CheckCircle2, Clock } from 'lucide-react';

// Custom markers
const volunteerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI4IiBmaWxsPSIjMTZhMzRhIi8+PHBhdGggZD0iTTE2IDE4QzEyIDIwIDggMjQgOCAyOEM4IDMwIDEyIDMyIDE2IDMyQzIwIDMyIDI0IDMwIDI0IDI4QzI0IDI0IDIwIDIwIDE2IDE4WiIgZmlsbD0iIzE2YTM0YSIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const activeTurfColor = '#2563eb';
const completedTurfColor = '#16a34a';

function MapBounds({ locations, turfs }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0 && turfs.length === 0) return;

    let bounds = null;

    // Add location bounds
    locations.forEach(loc => {
      const latLng = L.latLng(loc.latitude, loc.longitude);
      bounds = bounds ? bounds.extend(latLng) : L.latLngBounds(latLng, latLng);
    });

    // Add turf bounds
    turfs.forEach(turf => {
      if (turf.geojson) {
        try {
          const geoJson = JSON.parse(turf.geojson);
          const layer = L.geoJSON(geoJson);
          if (bounds) {
            bounds.extend(layer.getBounds());
          } else {
            bounds = layer.getBounds();
          }
        } catch {}
      }
    });

    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [locations, turfs, map]);

  return null;
}

export default function VolunteerLiveMap() {
  const [selectedTurf, setSelectedTurf] = useState('all');
  const [liveLocations, setLiveLocations] = useState({});

  const { data: volunteers = [], isLoading: volunteerLoading } = useQuery({
    queryKey: ['volunteerLocations'],
    queryFn: () => base44.entities.VolunteerLocation.list('-last_updated', 500),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: turfs = [], isLoading: turfLoading } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('name', 500),
  });

  const { data: canvassingLogs = [] } = useQuery({
    queryKey: ['canvassingLogs'],
    queryFn: () => base44.entities.CanvassingLog.list('-session_date', 1000),
  });

  // Subscribe to real-time location updates
  useEffect(() => {
    const unsubscribe = base44.entities.VolunteerLocation.subscribe((event) => {
      setLiveLocations(prev => ({
        ...prev,
        [event.id]: event.data
      }));
    });

    return unsubscribe;
  }, []);

  const isLoading = volunteerLoading || turfLoading;

  // Combine query and subscription data
  const allLocations = Object.values(liveLocations).length > 0 
    ? Object.values(liveLocations)
    : volunteers;

  // Get today's canvassing activity
  const today = new Date().toLocaleDateString('en-CA');
  const todayLogs = canvassingLogs.filter(log => 
    log.session_date === today
  );

  // Filter locations by turf
  const filteredLocations = selectedTurf === 'all' 
    ? allLocations
    : allLocations.filter(loc => loc.turf_id === selectedTurf);

  const filteredTurfs = selectedTurf === 'all'
    ? turfs
    : turfs.filter(t => t.id === selectedTurf);

  // Calculate stats
  const totalDoors = todayLogs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0);
  const positiveResponses = todayLogs.reduce((sum, log) => sum + (log.positive_responses || 0), 0);
  const activeVolunteers = new Set(allLocations.filter(l => l.status === 'active').map(l => l.volunteer_email)).size;

  if (isLoading && volunteers.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Live Canvassing Map</h1>
        <p className="text-muted-foreground mt-1">Real-time volunteer positions and turf progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeVolunteers}</div>
            <p className="text-xs text-muted-foreground mt-1">currently canvassing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doors Knocked Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDoors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">this session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positive Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{positiveResponses}</div>
            <p className="text-xs text-muted-foreground mt-1">supporters engaged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turfs Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{turfs.filter(t => t.assigned_to || t.assigned_team?.length).length}</div>
            <p className="text-xs text-muted-foreground mt-1">active zones</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Turf Zone</label>
                <Select value={selectedTurf} onValueChange={setSelectedTurf}>
                  <SelectTrigger>
                    <SelectValue placeholder="All turfs..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Turfs</SelectItem>
                    {turfs.map(turf => (
                      <SelectItem key={turf.id} value={turf.id}>
                        {turf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Volunteers
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active volunteers</p>
                  ) : (
                    filteredLocations.map(loc => (
                      <div key={loc.id} className="bg-muted/50 rounded-lg p-2 text-sm">
                        <p className="font-medium">{loc.volunteer_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {loc.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Idle</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs mt-1">
                          <span className="text-primary font-medium">{loc.doors_knocked_today || 0}</span> doors today
                        </p>
                        {loc.turf_name && (
                          <Badge className="mt-1 text-xs" variant="secondary">
                            {loc.turf_name}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardContent className="p-0 h-96 lg:h-[600px]">
              {filteredLocations.length === 0 && filteredTurfs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No data available for this view</p>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={[53.5, -2.3]} // Default to Lancashire area
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  {/* Turf boundaries */}
                  {filteredTurfs.map(turf => (
                    turf.geojson && (
                      <GeoJSON
                        key={turf.id}
                        data={JSON.parse(turf.geojson)}
                        style={() => ({
                          color: turf.status === 'completed' ? completedTurfColor : activeTurfColor,
                          opacity: 0.6,
                          fillOpacity: 0.1,
                          weight: 2,
                        })}
                      />
                    )
                  ))}

                  {/* Volunteer markers */}
                  {filteredLocations.map(location => (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      icon={volunteerIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-bold">{location.volunteer_name}</p>
                          <p className="text-xs text-muted-foreground">{location.turf_name || 'No turf assigned'}</p>
                          <div className="mt-2 text-xs space-y-1">
                            <p>Status: <Badge className="ml-1 text-xs">{location.status}</Badge></p>
                            <p>Doors: {location.doors_knocked_today || 0}</p>
                            {location.battery_level !== undefined && (
                              <p>Battery: {location.battery_level}%</p>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  <MapBounds locations={filteredLocations} turfs={filteredTurfs} />
                </MapContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}