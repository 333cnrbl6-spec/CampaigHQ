import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Zap, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

// Mock real-time volunteer data
const mockVolunteerData = [
  {
    id: 'vol-1',
    name: 'Alice Smith',
    latitude: 53.4809,
    longitude: -2.2374,
    turf: 'Tyldesley North',
    doorsKnocked: 28,
    positiveResponses: 12,
    undecided: 8,
    lastActive: '2026-05-07 14:32',
    status: 'active',
    momentum: 'excellent',
  },
  {
    id: 'vol-2',
    name: 'Bob Wilson',
    latitude: 53.4820,
    longitude: -2.2400,
    turf: 'Tyldesley Central',
    doorsKnocked: 22,
    positiveResponses: 9,
    undecided: 6,
    lastActive: '2026-05-07 14:28',
    status: 'active',
    momentum: 'good',
  },
  {
    id: 'vol-3',
    name: 'Carol Johnson',
    latitude: 53.4780,
    longitude: -2.2350,
    turf: 'Astley East',
    doorsKnocked: 35,
    positiveResponses: 14,
    undecided: 10,
    lastActive: '2026-05-07 14:35',
    status: 'active',
    momentum: 'excellent',
  },
  {
    id: 'vol-4',
    name: 'David Chen',
    latitude: 53.4900,
    longitude: -2.2500,
    turf: 'Mosley Common',
    doorsKnocked: 18,
    positiveResponses: 7,
    undecided: 4,
    lastActive: '2026-05-07 14:15',
    status: 'idle',
    momentum: 'ok',
  },
];

const mockActivityHeatmap = [
  [53.4809, -2.2374, 28],
  [53.4820, -2.2400, 22],
  [53.4780, -2.2350, 35],
  [53.4900, -2.2500, 18],
  [53.4850, -2.2380, 15],
  [53.4795, -2.2360, 12],
];

export default function GOTVLiveMap() {
  const [activeView, setActiveView] = useState('map');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [liveStats, setLiveStats] = useState({
    totalVolunteerActive: 3,
    totalDoorsKnocked: 103,
    totalPositiveResponses: 42,
    totalUndecided: 28,
    avgDoorsPerVolunteer: 26,
    liveTime: '14:35',
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        totalDoorsKnocked: prev.totalDoorsKnocked + Math.floor(Math.random() * 3),
        totalPositiveResponses: prev.totalPositiveResponses + Math.floor(Math.random() * 2),
        liveTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getMomentumColor = momentum => {
    switch (momentum) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'ok':
        return 'text-amber-600 bg-amber-100';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusColor = status => {
    return status === 'active' ? 'bg-green-600' : 'bg-amber-600';
  };

  return (
    <div className="space-y-6">
      {/* Live Update Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <p className="font-bold text-primary">🔴 LIVE ELECTION DAY - 7 May 2026</p>
            <p className="text-sm text-muted-foreground">Real-time volunteer tracking active</p>
          </div>
        </div>
        <Badge className="bg-green-600 animate-pulse">Live: {liveStats.liveTime}</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Volunteers Active</p>
              <p className="text-3xl font-bold text-green-600">{liveStats.totalVolunteerActive}</p>
              <p className="text-xs text-muted-foreground">Canvassing RIGHT NOW</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Doors Knocked</p>
              <p className="text-3xl font-bold text-green-600">
                {liveStats.totalDoorsKnocked.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">
                {liveStats.avgDoorsPerVolunteer} avg per volunteer
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700">Positive Responses</p>
              <p className="text-3xl font-bold text-blue-600">{liveStats.totalPositiveResponses}</p>
              <p className="text-xs text-blue-600">
                {Math.round((liveStats.totalPositiveResponses / liveStats.totalDoorsKnocked) * 100)}%
                conversion
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-700">Undecided</p>
              <p className="text-3xl font-bold text-amber-600">{liveStats.totalUndecided}</p>
              <p className="text-xs text-amber-600">
                Follow-up conversations queued
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3">
        {[
          { id: 'map', label: '🗺️ Live Map', icon: MapPin },
          { id: 'volunteers', label: '👥 Volunteer List', icon: Users },
          { id: 'leaderboard', label: '🏆 Live Leaderboard', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeView === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map View */}
      {activeView === 'map' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Live Volunteer Locations
                </CardTitle>
                <CardDescription>
                  Where volunteers are canvassing right now (Tyldesley area)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded-lg border flex items-center justify-center relative overflow-hidden">
              <MapContainer
                center={[53.4809, -2.2374]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* Volunteer Markers */}
                {mockVolunteerData.map(volunteer => (
                  <CircleMarker
                    key={volunteer.id}
                    center={[volunteer.latitude, volunteer.longitude]}
                    radius={12}
                    fillColor={volunteer.status === 'active' ? '#22c55e' : '#f59e0b'}
                    color="white"
                    weight={3}
                    opacity={1}
                    fillOpacity={0.8}
                    eventHandlers={{
                      click: () => setSelectedVolunteer(volunteer),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{volunteer.name}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.turf}</p>
                        <p className="text-xs mt-1">
                          Doors: {volunteer.doorsKnocked} | Positive: {volunteer.positiveResponses}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg border shadow-md text-sm">
                <p className="font-semibold mb-2">Legend</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span>Active volunteer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-600" />
                    <span>Idle (break)</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedVolunteer && (
              <div className="mt-4 p-4 bg-muted rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">{selectedVolunteer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedVolunteer.turf}</p>
                  </div>
                  <Badge className={getStatusColor(selectedVolunteer.status)}>
                    {selectedVolunteer.status === 'active' ? '🟢 Active' : '⏸️ Idle'}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Doors</p>
                    <p className="font-bold">{selectedVolunteer.doorsKnocked}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Positive</p>
                    <p className="font-bold text-green-600">{selectedVolunteer.positiveResponses}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Undecided</p>
                    <p className="font-bold text-amber-600">{selectedVolunteer.undecided}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Momentum</p>
                    <Badge className={getMomentumColor(selectedVolunteer.momentum)} variant="outline">
                      {selectedVolunteer.momentum}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Last active: {selectedVolunteer.lastActive}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Volunteer List View */}
      {activeView === 'volunteers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active Volunteers
            </CardTitle>
            <CardDescription>Real-time performance during canvassing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockVolunteerData.map(vol => (
              <div
                key={vol.id}
                className={`p-4 rounded-lg border ${
                  vol.status === 'active' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold">{vol.name}</p>
                    <p className="text-sm text-muted-foreground">{vol.turf}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(vol.status)} text-white`}>
                      {vol.status === 'active' ? '🟢 Active' : '⏸️ Idle'}
                    </Badge>
                    <Badge className={`ml-2 ${getMomentumColor(vol.momentum)}`}>
                      {vol.momentum}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-muted-foreground">Doors Knocked</p>
                    <p className="font-bold text-lg">{vol.doorsKnocked}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-muted-foreground">Positive</p>
                    <p className="font-bold text-green-600 text-lg">{vol.positiveResponses}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-muted-foreground">Undecided</p>
                    <p className="font-bold text-amber-600 text-lg">{vol.undecided}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded">
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-bold text-lg">
                      {Math.round((vol.doorsKnocked / 60) * 100) / 100} /min
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">Last active: {vol.lastActive}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard View */}
      {activeView === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Live Leaderboard
            </CardTitle>
            <CardDescription>Who's winning today? Real-time rankings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockVolunteerData
              .sort((a, b) => b.doorsKnocked - a.doorsKnocked)
              .map((vol, idx) => (
                <div key={vol.id} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0
                          ? 'bg-yellow-500'
                          : idx === 1
                            ? 'bg-gray-400'
                            : idx === 2
                              ? 'bg-orange-600'
                              : 'bg-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold">{vol.name}</p>
                      <p className="text-sm text-muted-foreground">{vol.turf}</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-bold text-lg">{vol.doorsKnocked}</p>
                    <p className="text-xs text-green-600">
                      {Math.round((vol.positiveResponses / vol.doorsKnocked) * 100)}% positive
                    </p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Momentum Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Campaign Momentum
          </CardTitle>
          <CardDescription>Real-time sentiment & energy levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-medium">Door Knock Rate</p>
              <Badge className="bg-green-600">📈 Accelerating</Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-600 w-75" />
            </div>
            <p className="text-xs text-muted-foreground">
              103 doors / 45 mins = 2.3 doors/min (target: 2.0)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-medium">Positive Response Rate</p>
              <Badge className="bg-blue-600">41% conversion</Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-41" />
            </div>
            <p className="text-xs text-muted-foreground">42 supporters / 103 doors contacted</p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="font-medium text-green-700 mb-1">✓ Excellent Momentum</p>
            <p className="text-sm text-green-600">
              Volunteers energized, conversion rates exceeding targets. Send reinforcements to
              highest-performing areas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Real-Time Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {
              type: 'success',
              message: '✓ Alice Smith reached 28 doors (+3 from 10 mins ago)',
            },
            {
              type: 'success',
              message: '✓ Carol Johnson hit 35 doors - highest performer!',
            },
            {
              type: 'warning',
              message: '⚠️ David Chen idle for 20 mins - check welfare',
            },
            {
              type: 'info',
              message: 'ℹ️ 42 positive responses logged so far today',
            },
          ].map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                alert.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}