import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Navigation, X, MapPin, ChevronDown, ChevronUp, FileText, Zap } from 'lucide-react';
import WalkSheetPrint from '@/components/canvassing/WalkSheetPrint';

// Point-in-polygon test (ray casting) — coords are [lng, lat]
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

function extractPolygonRings(geojson) {
  const rings = [];
  function processGeometry(geom) {
    if (!geom) return;
    if (geom.type === 'Polygon') rings.push(geom.coordinates[0]);
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => rings.push(poly[0]));
    else if (geom.type === 'Feature') processGeometry(geom.geometry);
    else if (geom.type === 'FeatureCollection') geom.features.forEach(f => processGeometry(f.geometry));
  }
  processGeometry(geojson);
  return rings;
}

function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

export default function TurfRoutePanel({ turf, onRouteReady, onClose }) {
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [totalDist, setTotalDist] = useState(0);
  const [showWalkSheet, setShowWalkSheet] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState(null); // { done, total }

  const { data: contacts = [], isSuccess: contactsLoaded, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts-for-route'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  // Auto-build route once contacts are loaded
  useEffect(() => {
    if (contactsLoaded && turf?.geojson && contacts.length > 0) {
      buildRoute();
    }
  }, [contactsLoaded, turf?.id]);

  function buildRoute() {
    if (!turf?.geojson) return;

    let geo;
    try { geo = JSON.parse(turf.geojson); } catch { return; }
    const rings = extractPolygonRings(geo);
    if (rings.length === 0) return;

    setLoading(true);
    setRoute([]);

    // Use stored latitude/longitude — no live geocoding needed
    const candidatePoints = contacts
      .filter(c => c.latitude != null && c.longitude != null)
      .filter(c => rings.some(ring => pointInPolygon([c.longitude, c.latitude], ring)))
      .map(c => ({ contact: c, coords: [c.longitude, c.latitude] }));

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

  async function runBatchGeocode() {
    setGeocoding(true);
    setGeocodeStatus(null);
    try {
      const res = await base44.functions.invoke('batchGeocodeContacts', {});
      setGeocodeStatus({
        done: res.data?.results?.succeeded ?? 0,
        total: res.data?.results?.total ?? 0,
      });
      // Reload contacts with fresh coords and rebuild route
      await refetchContacts();
      buildRoute();
    } finally {
      setGeocoding(false);
    }
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

  // How many contacts have stored coords vs total with addresses
  const geocodedCount = contacts.filter(c => c.latitude != null).length;
  const addressedCount = contacts.filter(c => c.address?.trim()).length;
  const needsGeocoding = geocodedCount < addressedCount;

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

          {/* Geocoding needed banner */}
          {needsGeocoding && !geocoding && route.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-amber-800 font-medium">
                {geocodedCount === 0
                  ? `${addressedCount} contacts need geocoding before zone filtering can work.`
                  : `${geocodedCount} of ${addressedCount} contacts geocoded. Run again to update the rest.`}
              </p>
              <Button size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white" onClick={runBatchGeocode}>
                <Zap className="w-3 h-3" /> Geocode All Contacts
              </Button>
            </div>
          )}

          {geocoding && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              Geocoding all contacts… this may take a minute.
            </div>
          )}

          {geocodeStatus && (
            <p className="text-xs text-green-700 font-medium">
              ✓ Geocoded {geocodeStatus.done} of {geocodeStatus.total} contacts.
            </p>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              Building route…
            </div>
          ) : route.length === 0 && !needsGeocoding ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <MapPin className="w-6 h-6 mx-auto mb-1 opacity-40" />
              {!turf?.geojson
                ? 'No boundary drawn for this zone yet.'
                : 'No geocoded contacts found inside this zone.'}
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={buildRoute}>
                Retry
              </Button>
            </div>
          ) : route.length > 0 ? (
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
          ) : null}
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