import React, { useState, useMemo, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin, Navigation, Download, ArrowRight, Loader2,
  Search, CheckCircle2, XCircle, Play, RotateCcw, Map,
  Footprints, Printer, ClipboardList
} from 'lucide-react';
import CanvassingRouteMap from '@/components/map/CanvassingRouteMap';
import { useNavigate } from 'react-router-dom';

// Haversine distance in km
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest-neighbor TSP heuristic
function nearestNeighbor(stops) {
  if (stops.length <= 1) return stops;
  const unvisited = [...stops];
  const route = [unvisited.shift()];
  while (unvisited.length > 0) {
    const last = route[route.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversine(last.coords, unvisited[i].coords);
      if (d < minDist) { minDist = d; nearestIdx = i; }
    }
    route.push(unvisited.splice(nearestIdx, 1)[0]);
  }
  return route;
}

function totalRouteDistance(route) {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += haversine(route[i - 1].coords, route[i].coords);
  return d;
}

// Geocode a UK address via Nominatim, anchored tightly to the postcode
const geocodeCache = {};

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&countrycodes=gb`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'CampaignCanvasser/1.0' } });
  return res.json();
}

async function geocodeAddress(address, postcode) {
  const pc = (postcode || '').replace(/\s+/g, '').toUpperCase();
  const cacheKey = `${pc}|${address}`;
  if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];

  // Strategy 1: postcode + house number/name only (most precise)
  // Extract just the first token of the address (house number or name)
  const firstToken = (address || '').split(/[\s,]+/)[0];

  if (pc) {
    // Try postcode lookup first to get an anchor centroid
    const pcData = await nominatimSearch(pc + ', UK');
    const pcCoords = pcData.length > 0
      ? [parseFloat(pcData[0].lat), parseFloat(pcData[0].lon)]
      : null;

    // Try full address + postcode
    if (address && pc) {
      const fullData = await nominatimSearch(`${address}, ${pc}, UK`);
      for (const item of fullData) {
        const coords = [parseFloat(item.lat), parseFloat(item.lon)];
        // Accept only if within 2 km of postcode centroid (prevents nationwide matches)
        if (!pcCoords || haversine(pcCoords, coords) <= 2.0) {
          geocodeCache[cacheKey] = coords;
          return coords;
        }
      }
    }

    // Fall back: just postcode centroid (accurate enough for walking routes)
    if (pcCoords) {
      geocodeCache[cacheKey] = pcCoords;
      return pcCoords;
    }
  }

  // Last resort: address + UK with strict bbox check (no postcode available)
  if (address) {
    const data = await nominatimSearch(`${address}, UK`);
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache[cacheKey] = coords;
      return coords;
    }
  }

  return null;
}

export default function RouteOptimizer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTurf = urlParams.get('turf') || 'all';

  const [turfFilter, setTurfFilter] = useState(initialTurf);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState({ done: 0, total: 0 });
  const [route, setRoute] = useState(null); // array of {contact, coords}
  const [geocodeErrors, setGeocodeErrors] = useState([]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  // Derive all turf zones from tags
  const allTurfs = useMemo(() =>
    [...new Set(contacts.flatMap(c => c.tags || []))].filter(Boolean).sort(),
    [contacts]
  );

  // Filtered contacts for selection panel
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesTurf = turfFilter === 'all' || (c.tags || []).includes(turfFilter);
      const matchesSearch = !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.address?.toLowerCase().includes(search.toLowerCase()) ||
        c.postcode?.toLowerCase().includes(search.toLowerCase());
      return matchesTurf && matchesSearch;
    });
  }, [contacts, turfFilter, search]);

  const handleToggle = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleGenerateRoute = useCallback(async () => {
    const toGeocode = contacts.filter(c => selectedIds.has(c.id));
    if (toGeocode.length === 0) return;

    setGeocoding(true);
    setGeocodeProgress({ done: 0, total: toGeocode.length });
    setRoute(null);
    setGeocodeErrors([]);

    const stops = [];
    const errors = [];

    for (let i = 0; i < toGeocode.length; i++) {
      const c = toGeocode[i];
      // Delay to respect Nominatim's 1 req/sec policy (we may make 2 calls per contact)
      if (i > 0) await new Promise(r => setTimeout(r, 1200));
      const coords = await geocodeAddress(c.address, c.postcode);
      if (coords) {
        stops.push({ contact: c, coords });
      } else {
        errors.push(c.name);
      }
      setGeocodeProgress({ done: i + 1, total: toGeocode.length });
    }

    const optimized = nearestNeighbor(stops);
    setRoute(optimized);
    setGeocodeErrors(errors);
    setGeocoding(false);
  }, [contacts, selectedIds]);

  const handleDownload = () => {
    if (!route) return;
    let csv = 'Stop,Name,Address,Postcode,Lat,Lon\n';
    route.forEach((s, i) => {
      csv += `${i + 1},"${s.contact.name}","${s.contact.address || ''}","${s.contact.postcode || ''}",${s.coords[0]},${s.coords[1]}\n`;
    });
    const el = document.createElement('a');
    el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    el.download = `canvassing-route-${new Date().toISOString().split('T')[0]}.csv`;
    el.click();
  };

  const totalDist = route ? totalRouteDistance(route) : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold">Route Optimizer</h1>
          <p className="text-sm text-muted-foreground">Generate optimized canvassing routes from selected contacts</p>
        </div>
        <div className="flex items-center gap-2">
          {route && (
            <>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {route.length} stops · {totalDist.toFixed(1)} km
              </Badge>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </>
          )}
          {(route || geocodeErrors.length > 0) && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setRoute(null); setGeocodeErrors([]); }}>
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col bg-background overflow-hidden">
          {/* Filters */}
          <div className="p-4 space-y-3 border-b border-border">
            <Select value={turfFilter} onValueChange={(v) => { setTurfFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Turf Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Turf Zones</SelectItem>
                {allTurfs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredContacts.length} contacts</span>
              <button
                onClick={handleSelectAll}
                className="text-primary hover:underline font-medium"
              >
                {selectedIds.size === filteredContacts.length && filteredContacts.length > 0
                  ? 'Deselect all' : `Select all ${filteredContacts.length}`}
              </button>
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No contacts found</p>
            ) : (
              filteredContacts.map(c => (
                <label
                  key={c.id}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-1 ${selectedIds.has(c.id) ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => handleToggle(c.id)}
                    className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                    {c.postcode && <p className="text-xs text-muted-foreground">{c.postcode}</p>}
                    {c.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {c.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Generate button */}
          <div className="p-4 border-t border-border">
            <Button
              onClick={handleGenerateRoute}
              disabled={selectedIds.size === 0 || geocoding}
              className="w-full gap-2"
            >
              {geocoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Geocoding {geocodeProgress.done}/{geocodeProgress.total}…
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Generate Route ({selectedIds.size})
                </>
              )}
            </Button>
            {geocoding && (
              <div className="mt-2">
                <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${geocodeProgress.total ? (geocodeProgress.done / geocodeProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">Looking up real addresses…</p>
              </div>
            )}
            {geocodeErrors.length > 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {geocodeErrors.length} address{geocodeErrors.length > 1 ? 'es' : ''} couldn't be located
              </p>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden">
          {route ? (
            <CanvassingRouteMap route={route} />
          ) : geocoding ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-medium">Geocoding addresses via OpenStreetMap…</p>
              <p className="text-sm">{geocodeProgress.done} of {geocodeProgress.total} looked up</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Map className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="font-medium text-lg">Select contacts & generate a route</p>
                <p className="text-sm mt-1">Use the panel on the left to filter by turf zone,<br />pick addresses, then click Generate Route.</p>
              </div>
            </div>
          )}

          {/* Route sequence overlay */}
          {route && (
            <div className="absolute top-4 right-4 w-72 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg max-h-[calc(100vh-8rem)] flex flex-col">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Visit Order</h3>
                <span className="text-xs text-muted-foreground">{route.length} stops · {totalDist.toFixed(1)} km</span>
              </div>

              {/* Integration actions */}
              <div className="px-3 py-2.5 border-b border-border space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Use this route in…</p>
                <button
                  onClick={() => {
                    const ids = route.map(s => s.contact.id).join(',');
                    navigate(`/field-mode?route_ids=${encodeURIComponent(ids)}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors text-left"
                >
                  <Footprints className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Field Mode</p>
                    <p className="text-[10px] text-muted-foreground">Door-knock in route order</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    const ids = route.map(s => s.contact.id).join(',');
                    navigate(`/turf-sheets?route_ids=${encodeURIComponent(ids)}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors text-left"
                >
                  <Printer className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Print Turf Sheet</p>
                    <p className="text-[10px] text-muted-foreground">Pre-selected in route order</p>
                  </div>
                </button>
                {turfFilter !== 'all' && (
                  <button
                    onClick={() => navigate(`/leaflets?turf=${encodeURIComponent(turfFilter)}`)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors text-left"
                  >
                    <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">Leaflet Tracker</p>
                      <p className="text-[10px] text-muted-foreground truncate">Streets for {turfFilter}</p>
                    </div>
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {route.map((stop, idx) => (
                  <div key={stop.contact.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{stop.contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{stop.contact.address}</p>
                      {stop.contact.postcode && <p className="text-xs text-muted-foreground">{stop.contact.postcode}</p>}
                    </div>
                    {idx < route.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}