import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Clock, Activity } from 'lucide-react';

// Create custom volunteer marker icon
function createVolunteerIcon(status = 'active') {
  const colors = {
    active: '#10b981',
    idle: '#f59e0b',
    offline: '#6b7280',
  };

  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[status]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        👤
      </div>
    `,
    iconSize: [32, 32],
    className: 'volunteer-marker',
  });
}

export default function LiveVolunteerMap() {
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'all'

  // Fetch and subscribe to location updates
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locations = await base44.entities.VolunteerLocation.list('-last_updated', 100);
        setVolunteers(locations);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch volunteer locations:', err);
        setIsLoading(false);
      }
    };

    fetchLocations();

    // Subscribe to real-time location updates
    const unsubscribe = base44.entities.VolunteerLocation.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        setVolunteers((prev) => {
          const filtered = prev.filter(v => v.id !== event.id);
          return [event.data, ...filtered];
        });
      } else if (event.type === 'delete') {
        setVolunteers((prev) => prev.filter(v => v.id !== event.id));
      }
    });

    return unsubscribe;
  }, []);

  // Mark volunteers as idle if no update in 15 mins
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setVolunteers((prev) =>
        prev.map((v) => {
          const lastUpdate = new Date(v.last_updated);
          const diffMins = (now - lastUpdate) / (1000 * 60);
          const newStatus = diffMins > 15 ? 'idle' : v.status;
          return { ...v, status: newStatus };
        })
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'active') {
      return volunteers.filter(v => v.status === 'active');
    }
    return volunteers;
  }, [volunteers, filter]);

  const center = useMemo(() => {
    if (filtered.length === 0) return [53.48, -2.24]; // Default: UK center
    const lats = filtered.map(v => v.latitude);
    const lons = filtered.map(v => v.longitude);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lons) + Math.max(...lons)) / 2,
    ];
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="animate-spin">⏳</div> Loading live locations...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-lg">Live Volunteer Tracking</h2>
          <Badge variant="outline" className="ml-2">
            {filtered.length} active
          </Badge>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All ({volunteers.length})
          </button>
        </div>
      </div>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-96 rounded-lg overflow-hidden border border-border">
            {filtered.length > 0 ? (
              <MapContainer
                center={center}
                zoom={13}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {filtered.map((volunteer) => (
                  <Marker
                    key={volunteer.id}
                    position={[volunteer.latitude, volunteer.longitude]}
                    icon={createVolunteerIcon(volunteer.status)}
                  >
                    <Popup>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">{volunteer.volunteer_name}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.volunteer_email}</p>
                        {volunteer.turf_name && (
                          <p className="text-xs">🎯 {volunteer.turf_name}</p>
                        )}
                        <p className="text-xs">📍 {volunteer.postcode || 'Unknown'}</p>
                        <p className="text-xs">🚪 {volunteer.doors_knocked_today} doors today</p>
                        {volunteer.battery_level && (
                          <p className="text-xs">🔋 {volunteer.battery_level}%</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Last: {new Date(volunteer.last_updated).toLocaleTimeString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto opacity-20 mb-2" />
                  <p>No active volunteers in the field</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Volunteer List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Volunteers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active volunteers</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((v) => {
                const lastUpdateMins = Math.floor(
                  (new Date() - new Date(v.last_updated)) / (1000 * 60)
                );

                return (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      v.status === 'active' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{v.volunteer_name}</p>
                      <p className="text-xs text-muted-foreground">{v.turf_name || 'Unassigned'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-semibold text-sm">{v.doors_knocked_today}</span>
                        <span className="text-xs text-muted-foreground">doors</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lastUpdateMins}m ago
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}