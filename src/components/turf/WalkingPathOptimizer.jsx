import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Zap, Clock, MapPin } from 'lucide-react';

export default function WalkingPathOptimizer({ turf, contacts, onPathReady }) {
  const [optimizing, setOptimizing] = useState(false);
  const [pathStats, setPathStats] = useState(null);
  const [path, setPath] = useState([]);

  useEffect(() => {
    if (!turf || !contacts.length) return;

    const calculateOptimizedPath = () => {
      setOptimizing(true);

      // Get contacts in turf with valid coordinates
      const turfContacts = contacts
        .filter(c => c.latitude && c.longitude)
        .slice(0, 200); // Cap at 200 for performance

      if (turfContacts.length === 0) {
        setOptimizing(false);
        return;
      }

      // Nearest neighbor algorithm for TSP approximation
      const optimizedPath = nearestNeighborTSP(turfContacts);
      
      // Calculate statistics
      const distance = calculateTotalDistance(optimizedPath);
      const avgWalkingSpeed = 1.4; // m/s (about 5 km/h)
      const estimatedTime = (distance / avgWalkingSpeed) / 60; // minutes

      setPath(optimizedPath.map(c => [c.latitude, c.longitude]));
      setPathStats({
        distance: (distance / 1000).toFixed(2), // km
        doors: optimizedPath.length,
        timeMinutes: Math.round(estimatedTime),
        doorsPerHour: Math.round((optimizedPath.length / estimatedTime) * 60),
      });

      onPathReady(optimizedPath.map(c => [c.latitude, c.longitude]));
      setOptimizing(false);
    };

    calculateOptimizedPath();
  }, [turf, contacts]);

  // Nearest neighbor approximation of TSP
  const nearestNeighborTSP = (points) => {
    if (points.length <= 1) return points;

    const remaining = new Set(points.map((_, i) => i));
    const path = [points[0]];
    remaining.delete(0);

    while (remaining.size > 0) {
      const current = path[path.length - 1];
      let nearest = null;
      let minDist = Infinity;

      for (const idx of remaining) {
        const dist = haversineDistance(
          current.latitude, current.longitude,
          points[idx].latitude, points[idx].longitude
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = idx;
        }
      }

      path.push(points[nearest]);
      remaining.delete(nearest);
    }

    return path;
  };

  // Haversine distance in meters
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Sum total distance
  const calculateTotalDistance = (points) => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += haversineDistance(
        points[i - 1].latitude, points[i - 1].longitude,
        points[i].latitude, points[i].longitude
      );
    }
    return total;
  };

  if (!pathStats) return null;

  return (
    <Card className="w-full max-w-sm bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="w-4 h-4" /> Walking Path Optimized
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> Distance
            </div>
            <div className="text-xl font-bold text-primary">{pathStats.distance} km</div>
          </div>
          <div className="bg-card rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> Est. Time
            </div>
            <div className="text-xl font-bold text-accent">{pathStats.timeMinutes} min</div>
          </div>
          <div className="bg-card rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Doors to Knock</div>
            <div className="text-xl font-bold">{pathStats.doors}</div>
          </div>
          <div className="bg-card rounded-lg p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Efficiency</div>
            <div className="text-xl font-bold text-green-600">{pathStats.doorsPerHour} /hr</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-2">
            <Zap className="w-3 h-3" /> AI Optimized
          </div>
          <p>Path uses nearest-neighbor approximation for efficient walking routes. Start at marker 1 (green) and follow the numbered sequence.</p>
        </div>
      </CardContent>
    </Card>
  );
}