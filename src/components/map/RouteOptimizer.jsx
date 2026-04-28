import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Route, Navigation, RotateCcw, CheckCircle2, Clock, Home } from 'lucide-react';

// Nearest-neighbour TSP approximation
function nearestNeighbourRoute(points) {
  if (points.length === 0) return [];
  const unvisited = [...points];
  const route = [unvisited.shift()];
  while (unvisited.length > 0) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    unvisited.forEach((p, i) => {
      const d = haversine(last.coords, p.coords);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    route.push(unvisited.splice(bestIdx, 1)[0]);
  }
  return route;
}

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(metres) {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}

function totalDistance(route) {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += haversine(route[i - 1].coords, route[i].coords);
  return d;
}

export default function RouteOptimizer({ contacts, postcodeCoords, onRouteChange }) {
  const [selectedPostcode, setSelectedPostcode] = useState('');
  const [route, setRoute] = useState([]);
  const [generated, setGenerated] = useState(false);

  // Get unique postcodes that have uncanvassed contacts
  const availablePostcodes = useMemo(() => {
    const pcs = new Set();
    contacts.forEach(c => {
      if (!c.canvassed && c.postcode) {
        const pc = c.postcode.trim().toUpperCase();
        if (postcodeCoords[pc]) pcs.add(pc);
      }
    });
    return Array.from(pcs).sort();
  }, [contacts, postcodeCoords]);

  // Uncanvassed contacts in the selected postcode area
  const targetContacts = useMemo(() => {
    if (!selectedPostcode) return [];
    const base = selectedPostcode.split(' ')[0];
    return contacts.filter(c => {
      if (c.canvassed) return false;
      const pc = (c.postcode || '').trim().toUpperCase();
      return pc === selectedPostcode || pc.startsWith(base);
    });
  }, [contacts, selectedPostcode]);

  const handleGenerate = () => {
    // Build points: one per unique postcode cluster in the area
    const pcMap = {};
    targetContacts.forEach(c => {
      const pc = (c.postcode || '').trim().toUpperCase();
      if (!pcMap[pc] && postcodeCoords[pc]) {
        pcMap[pc] = { postcode: pc, coords: postcodeCoords[pc], contacts: [] };
      }
      if (pcMap[pc]) pcMap[pc].contacts.push(c);
    });

    const points = Object.values(pcMap);
    if (points.length === 0) return;

    const optimised = nearestNeighbourRoute(points);
    setRoute(optimised);
    setGenerated(true);
    onRouteChange(optimised);
  };

  const handleReset = () => {
    setRoute([]);
    setGenerated(false);
    onRouteChange([]);
  };

  const dist = route.length > 1 ? totalDistance(route) : 0;
  const estMinutes = Math.round((dist / 1000 / 4) * 60); // ~4km/h walking

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Route className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Route Optimiser</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Select postcode area</label>
          <Select value={selectedPostcode} onValueChange={v => { setSelectedPostcode(v); handleReset(); }}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Choose a postcode..." />
            </SelectTrigger>
            <SelectContent>
              {availablePostcodes.map(pc => {
                const count = contacts.filter(c => !c.canvassed && (c.postcode || '').trim().toUpperCase() === pc).length;
                return (
                  <SelectItem key={pc} value={pc}>
                    {pc} — {count} unvisited
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedPostcode && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Home className="w-3 h-3" />
            <span>{targetContacts.length} uncanvassed contacts in this area</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={handleGenerate}
            disabled={!selectedPostcode || targetContacts.length === 0}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Generate Route
          </Button>
          {generated && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleReset}>
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {generated && route.length > 0 && (
        <div className="space-y-3 pt-1 border-t border-border">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary/8 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">{route.length}</p>
              <p className="text-xs text-muted-foreground">stops</p>
            </div>
            <div className="bg-primary/8 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">{formatDistance(dist)}</p>
              <p className="text-xs text-muted-foreground">total</p>
            </div>
            <div className="bg-primary/8 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">{estMinutes}m</p>
              <p className="text-xs text-muted-foreground">est. walk</p>
            </div>
          </div>

          {/* Stop list */}
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {route.map((stop, idx) => (
              <div key={stop.postcode} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-muted/50">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{stop.postcode}</p>
                  <p className="text-muted-foreground">{stop.contacts.length} door{stop.contacts.length !== 1 ? 's' : ''}</p>
                </div>
                {idx > 0 && (
                  <span className="text-muted-foreground text-[10px]">
                    +{formatDistance(haversine(route[idx - 1].coords, stop.coords))}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>Optimised using nearest-neighbour routing</span>
          </div>
        </div>
      )}
    </div>
  );
}