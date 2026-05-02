import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Navigation, X, MapPin, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import WalkSheetPrint from '@/components/canvassing/WalkSheetPrint';

// Point-in-polygon test (ray casting)
function pointInPolygon(point, polygon) {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Extract all polygon rings from a GeoJSON feature/geometry
function extractPolygonRings(geojson) {
  const rings = [];
  function processGeometry(geom) {
    if (!geom) return;
    if (geom.type === 'Polygon') {
      rings.push(geom.coordinates[0]);
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(poly => rings.push(poly[0]));
    } else if (geom.type === 'Feature') {
      processGeometry(geom.geometry);
    } else if (geom.type === 'FeatureCollection') {
      geom.features.forEach(f => processGeometry(f.geometry));
    }
  }
  processGeometry(geojson);
  return rings;
}

// Distance in metres between two [lng, lat] points
function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest-neighbour TSP heuristic
function nearestNeighbourRoute(points) {
  if (points.length === 0) return [];
  const visited = new Array(points.length).fill(false);
  const route = [0];
  visited[0] = true;
  for (let step = 1; step < points.length; step++) {
    const last = route[route.length - 1];
    let nearest = -1, nearestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      if (visited[i]) continue;
      const d = haversine(points[last].coords, points[i].coords);
      if (d < nearestDist) { nearest = i; nearestDist = d; }
    }
    if (nearest !== -1) { route.push(nearest); visited[nearest] = true; }
  }
  return route.map(i => points[i]);
}

// Try to geocode an address string using Nominatim
async function geocodeAddress(address, postcode) {
  const query = postcode ? `${address}, ${postcode}` : address;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { 
      headers: { 'Accept-Language': 'en' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) return null;
    
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
  } catch (error) {
    console.warn(`Geocoding failed for "${query}":`, error.message);
  }
  
  return null;
}

export default function TurfRoutePanel({ turf, onRouteReady, onClose }) {
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [totalDist, setTotalDist] = useState(0);
  const [showWalkSheet, setShowWalkSheet] = useState(false);
  const [progress, setProgress] = useState({ stage: '', current: 0, total: 0, found: 0 });

  const { data: contacts = [], isSuccess: contactsLoaded } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  // Auto-build route once contacts are loaded and turf has a boundary
  useEffect(() => {
    if (contactsLoaded && turf?.geojson && contacts.length > 0) {
      buildRoute();
    }
  }, [contactsLoaded, turf?.id]);

  async function buildRoute() {
    setLoading(true);
    setRoute([]);
    setProgress({ stage: 'Preparing…', current: 0, total: 0, found: 0 });

    let geo;
    try { geo = JSON.parse(turf.geojson); } catch { setLoading(false); return; }
    const rings = extractPolygonRings(geo);
    if (rings.length === 0) { setLoading(false); return; }

    // Only process contacts that have an address
    const addressedContacts = contacts.filter(c => c.address && c.address.trim());
    const total = addressedContacts.length;
    setProgress({ stage: `Found ${total} contacts with addresses — geocoding…`, current: 0, total, found: 0 });

    const candidatePoints = [];

    for (let i = 0; i < addressedContacts.length; i++) {
      const contact = addressedContacts[i];
      setProgress({ stage: 'Geocoding addresses…', current: i + 1, total, found: candidatePoints.length });
      const coords = await geocodeAddress(contact.address, contact.postcode);
      if (!coords) continue;
      const inside = rings.some(ring => pointInPolygon(coords, ring));
      if (inside) candidatePoints.push({ contact, coords });
    }

    setProgress({ stage: 'Optimising route…', current: total, total, found: candidatePoints.length });

    const ordered = nearestNeighbourRoute(candidatePoints);
    setRoute(ordered);

    let dist = 0;
    for (let i = 1; i < ordered.length; i++) {
      dist += haversine(ordered[i - 1].coords, ordered[i].coords);
    }
    setTotalDist(Math.round(dist));

    if (onRouteReady) onRouteReady(ordered.map(p => [p.coords[1], p.coords[0]]));

    setLoading(false);
  }

  const openGoogleMaps = () => {
    if (route.length === 0) return;
    const waypoints = route.map(p => `${p.coords[1]},${p.coords[0]}`);
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${middle ? `&waypoints=${middle}` : ''}&travelmode=walking`;
    window.open(url, '_blank');
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-80 bg-card border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Route className="w-4 h-4" />
          Walking Route — {turf.name}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(e => !e)} className="p-1 hover:bg-white/20 rounded">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                {progress.stage}
              </div>
              {progress.total > 0 && (
                <>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.current} of {progress.total} addresses geocoded</span>
                    <span className="text-primary font-medium">{progress.found} in this zone</span>
                  </div>
                </>
              )}
            </div>
          ) : route.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <MapPin className="w-6 h-6 mx-auto mb-1 opacity-40" />
              {!turf?.geojson
                ? 'No boundary drawn for this zone yet.'
                : 'No contacts with addresses found inside this zone.'}
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={buildRoute}>
                {!turf?.geojson ? 'Draw a boundary first' : 'Retry'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span><strong className="text-foreground">{route.length}</strong> stops</span>
                <Badge variant="secondary">{totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`} walk</Badge>
              </div>

              <ol className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {route.map((p, idx) => (
                  <li key={p.contact.id} className="flex items-start gap-2 text-xs py-1 border-b last:border-0">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 mt-0.5">{idx + 1}</span>
                    <div>
                      <p className="font-medium">{p.contact.name}</p>
                      <p className="text-muted-foreground">{p.contact.address}{p.contact.postcode ? `, ${p.contact.postcode}` : ''}</p>
                      {p.contact.support_level && p.contact.support_level !== 'unknown' && (
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          p.contact.support_level === 'strong_supporter' ? 'bg-green-100 text-green-700' :
                          p.contact.support_level === 'leaning' ? 'bg-blue-100 text-blue-700' :
                          p.contact.support_level === 'undecided' ? 'bg-yellow-100 text-yellow-700' :
                          p.contact.support_level === 'opposed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.contact.support_level.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-2" onClick={openGoogleMaps}>
                  <Navigation className="w-4 h-4" /> Google Maps
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => setShowWalkSheet(true)}>
                  <FileText className="w-4 h-4" /> Walk Sheet
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {showWalkSheet && route.length > 0 && (
        <WalkSheetPrint
          stops={route}
          title={`${turf.name} — Walking Route`}
          onClose={() => setShowWalkSheet(false)}
        />
      )}
    </div>
  );
}