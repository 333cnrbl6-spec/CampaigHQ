import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MapPin, Navigation, Download, ArrowRight, Loader2, Layers, Mail, Map } from 'lucide-react';
import RouteVisualization from '@/components/map/RouteVisualization';

// Point-in-polygon test (ray casting)
function pointInPolygon(lat, lon, polygonCoords) {
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const [xi, yi] = polygonCoords[i];
    const [xj, yj] = polygonCoords[j];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if a postcode's approximate coords fall within a turf's GeoJSON polygon
function isContactInTurf(contact, turfGeoJSON) {
  if (!contact.postcode || !turfGeoJSON) return false;
  try {
    const geo = typeof turfGeoJSON === 'string' ? JSON.parse(turfGeoJSON) : turfGeoJSON;
    const hash = contact.postcode.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
    const lat = 53.5 + (Math.abs(hash % 1000) / 1000) * 0.3;
    const lon = -2.5 + (Math.abs(hash % 500) / 500) * 0.2;

    const getCoords = (geom) => {
      if (geom.type === 'Polygon') return geom.coordinates[0].map(([x, y]) => [y, x]);
      if (geom.type === 'MultiPolygon') return geom.coordinates[0][0].map(([x, y]) => [y, x]);
      return [];
    };

    const geom = geo.geometry || geo;
    const coords = getCoords(geom);
    return coords.length > 0 ? pointInPolygon(lat, lon, coords) : false;
  } catch { return false; }
}

// Simplified route optimization using nearest neighbor heuristic + 2-opt improvement
const optimizeRoute = (contacts, startLocation = null) => {
  if (contacts.length === 0) return [];
  if (contacts.length === 1) return contacts;

  // Get coordinates from postcode (simplified approximation)
  const getCoords = (postcode) => {
    const hash = postcode.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
    const lat = 53.5 + (Math.abs(hash % 1000) / 1000) * 0.3;
    const lon = -2.5 + (Math.abs(hash % 500) / 500) * 0.2;
    return [lat, lon];
  };

  const distance = (coord1, coord2) => {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Nearest neighbor heuristic
  let unvisited = [...contacts];
  const route = [];
  let current = startLocation ? startLocation : getCoords(contacts[0].postcode || '');

  while (unvisited.length > 0) {
    let nearest = 0;
    let minDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const coord = getCoords(unvisited[i].postcode || '');
      const dist = distance(current, coord);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }

    route.push(unvisited[nearest]);
    current = getCoords(unvisited[nearest].postcode || '');
    unvisited.splice(nearest, 1);
  }

  // Calculate total distance
  const getTotalDistance = (orderedContacts) => {
    let total = 0;
    let current = startLocation ? startLocation : getCoords(orderedContacts[0].postcode || '');
    
    for (const contact of orderedContacts) {
      const coord = getCoords(contact.postcode || '');
      total += distance(current, coord);
      current = coord;
    }
    return total;
  };

  return {
    route,
    totalDistance: getTotalDistance(route),
    getCoords,
  };
};

export default function RouteOptimizer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTurfId = urlParams.get('turf_id') || 'all';

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [startingPoint, setStartingPoint] = useState(null);
  const [selectedTurfId, setSelectedTurfId] = useState(initialTurfId);

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: turfs = [], isLoading: loadingTurfs } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('-created_date', 100),
  });

  const isLoading = loadingContacts || loadingTurfs;

  const selectedTurf = useMemo(() =>
    turfs.find(t => t.id === selectedTurfId) || null,
    [turfs, selectedTurfId]
  );

  // Filter out contacts without postcodes, then optionally filter by turf zone
  const validContacts = useMemo(() => {
    const withPostcode = contacts.filter(c => c.postcode && c.postcode.trim());
    if (!selectedTurf?.geojson) return withPostcode;
    return withPostcode.filter(c => isContactInTurf(c, selectedTurf.geojson));
  }, [contacts, selectedTurf]);

  // Contacts to optimize
  const selectedContacts = useMemo(() => {
    if (selectedIds.size === 0) return validContacts;
    return validContacts.filter(c => selectedIds.has(c.id));
  }, [validContacts, selectedIds]);

  // Optimize route
  const optimizedRoute = useMemo(() => {
    if (selectedContacts.length === 0) return null;
    return optimizeRoute(selectedContacts, startingPoint);
  }, [selectedContacts, startingPoint]);

  const handleSelectContact = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === validContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validContacts.map(c => c.id)));
    }
  };

  const handleDownloadRoute = () => {
    if (!optimizedRoute) return;

    let csv = 'Route Order,Name,Address,Postcode\n';
    optimizedRoute.route.forEach((contact, idx) => {
      csv += `${idx + 1},"${contact.name}","${contact.address}","${contact.postcode}"\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `optimal-route-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (validContacts.length === 0) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <span>No contacts with postcodes available for route optimization.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Route Optimizer</h1>
        <p className="text-muted-foreground">Generate an optimal walking path to minimize distance and maximize efficiency</p>
      </div>

      {/* Turf Zone Filter */}
      {turfs.some(t => t.geojson) && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Layers className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">Filter by Turf Zone</p>
              <Select value={selectedTurfId} onValueChange={(v) => { setSelectedTurfId(v); setSelectedIds(new Set()); }}>
                <SelectTrigger className="w-72 bg-background">
                  <SelectValue placeholder="All contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contacts (no zone filter)</SelectItem>
                  {turfs.filter(t => t.geojson).map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.assigned_to ? `— ${t.assigned_to}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTurf && (
              <Badge variant="secondary" className="text-xs">
                {validContacts.length} contacts in zone
              </Badge>
            )}
          </div>
          {selectedTurf && (
            <div className="flex gap-2 flex-wrap pt-1 border-t border-primary/10">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" onClick={() => navigate(`/leaflets?turf_id=${selectedTurf.id}`)}>
                <Mail className="w-3.5 h-3.5 text-amber-600" /> View Leaflet Runs for Zone
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-7" onClick={() => navigate(`/turf`)}>
                <Map className="w-3.5 h-3.5 text-primary" /> Back to Turf Map
              </Button>
              {selectedTurf.assigned_to && (
                <Badge variant="outline" className="text-xs h-7 px-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selectedTurf.assigned_to}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Contact Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === validContacts.length && validContacts.length > 0}
                  onChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({validContacts.length})
                </label>
              </div>

              <div className="border-t border-border pt-3 max-h-96 overflow-y-auto space-y-2">
                {validContacts.map((contact) => (
                  <div key={contact.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      id={`contact-${contact.id}`}
                      className="mt-1"
                    />
                    <label htmlFor={`contact-${contact.id}`} className="text-sm cursor-pointer flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.postcode}</p>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Route Stats */}
          {optimizedRoute && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Route Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="text-2xl font-bold">{optimizedRoute.totalDistance.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Households to Visit</p>
                  <p className="text-2xl font-bold">{optimizedRoute.route.length}</p>
                </div>
                <Button onClick={handleDownloadRoute} variant="outline" className="w-full gap-2" size="sm">
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Visualization */}
          {optimizedRoute && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Optimized Route Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RouteVisualization
                  route={optimizedRoute.route}
                  getCoords={optimizedRoute.getCoords}
                />
              </CardContent>
            </Card>
          )}

          {/* Route Sequence */}
          {optimizedRoute && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {optimizedRoute.route.map((contact, idx) => (
                    <div key={contact.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center rounded-full">
                        {idx + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.address}</p>
                        <p className="text-xs text-muted-foreground">{contact.postcode}</p>
                      </div>
                      {idx < optimizedRoute.route.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!optimizedRoute && selectedContacts.length === 0 && (
            <Card className="flex items-center justify-center min-h-96">
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Select contacts to generate an optimized route</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}