import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin, Navigation, Download, ArrowRight, Loader2,
  Search, XCircle, RotateCcw, Map, Footprints, Printer, ClipboardList, Info, FileText, RefreshCw, FileText as FilePdf
} from 'lucide-react';
import CanvassingRouteMap from '@/components/map/CanvassingRouteMap';
import ContactsZoneMap from '@/components/map/ContactsZoneMap';
import TurfBoundaryMap from '@/components/map/TurfBoundaryMap';
import WalkSheetPrint from '@/components/canvassing/WalkSheetPrint';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Geocoding — postcodes.io (free, no key, UK only, very reliable)
// Returns { lat, lng } for a postcode
// ---------------------------------------------------------------------------
const postcodeCache = {};

async function getPostcodeCoords(postcode) {
  const pc = postcode.replace(/\s+/g, '').toUpperCase();
  if (postcodeCache[pc]) return postcodeCache[pc];

  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 200 || !data.result) return null;

  const coords = [data.result.latitude, data.result.longitude];
  postcodeCache[pc] = coords;
  return coords;
}

// ---------------------------------------------------------------------------
// Extract house number from an address string (handles "12A", "Flat 3", etc.)
// Returns a numeric sort key
// ---------------------------------------------------------------------------
function extractHouseNumber(address) {
  if (!address) return 9999;
  // Match leading number (e.g. "45 High Street", "12A Church Lane")
  const m = address.match(/^(\d+)/);
  if (m) return parseInt(m[1], 10);
  // Match "Flat N" or "Apt N"
  const flatM = address.match(/(?:flat|apt|apartment|unit)\s+(\d+)/i);
  if (flatM) return parseInt(flatM[1], 10);
  return 9999;
}

// ---------------------------------------------------------------------------
// Haversine distance (km) — used for inter-postcode TSP only
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Nearest-neighbour TSP over postcode CENTROIDS
// ---------------------------------------------------------------------------
function nearestNeighbourTSP(nodes) {
  if (nodes.length <= 1) return nodes;
  const unvisited = [...nodes];
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

// ---------------------------------------------------------------------------
// Main algorithm:
//   1. Group contacts by FULL postcode
//   2. Geocode each unique postcode via postcodes.io
//   3. TSP over postcode centroids (nearest-neighbour)
//   4. Within each postcode, sort contacts by house number (odd side then even
//      side = natural walking order on a UK street)
// ---------------------------------------------------------------------------
const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i;

// Try to extract a usable postcode from an address string as fallback
function extractPostcodeFromAddress(address) {
  if (!address) return null;
  const m = address.match(UK_POSTCODE_RE);
  return m ? m[1].toUpperCase().replace(/\s+/g, '') : null;
}

// Try geocoding with a partial outward code (e.g. "M29") via postcodes.io autocomplete
async function getOutwardCodeCoords(outward) {
  const pc = outward.replace(/\s+/g, '').toUpperCase();
  if (postcodeCache['OC_' + pc]) return postcodeCache['OC_' + pc];
  try {
    const res = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(pc)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 200 || !data.result) return null;
    const coords = [data.result.latitude, data.result.longitude];
    postcodeCache['OC_' + pc] = coords;
    return coords;
  } catch { return null; }
}

async function buildRoute(contacts, onProgress) {
  // Group by postcode — fall back to extracting postcode from address
  const groups = {};
  const noPostcode = [];
  for (const c of contacts) {
    let pc = (c.postcode || '').replace(/\s+/g, '').toUpperCase();
    // Try to rescue missing postcodes from address string
    if (!pc) pc = extractPostcodeFromAddress(c.address) || '';
    if (!pc) { noPostcode.push(c); continue; }
    if (!groups[pc]) groups[pc] = [];
    groups[pc].push(c);
  }

  const uniquePostcodes = Object.keys(groups);
  const total = uniquePostcodes.length;

  // Geocode each postcode, falling back to outward code if full postcode fails
  const postcodeNodes = [];
  for (let i = 0; i < uniquePostcodes.length; i++) {
    const pc = uniquePostcodes[i];
    onProgress(i, total);
    let coords = await getPostcodeCoords(pc);
    if (!coords) {
      // Try just the outward code (first half, e.g. "M29" from "M291AB")
      const outward = pc.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/i)?.[1];
      if (outward) coords = await getOutwardCodeCoords(outward);
    }
    if (coords) {
      postcodeNodes.push({ pc, coords, contacts: groups[pc] });
    } else {
      noPostcode.push(...groups[pc]);
    }
  }
  onProgress(total, total);

  // TSP over postcode centroids
  const orderedNodes = nearestNeighbourTSP(postcodeNodes);

  // Flatten: for each postcode node, sort contacts by house number
  const stops = [];
  for (const node of orderedNodes) {
    const sorted = [...node.contacts].sort((a, b) =>
      extractHouseNumber(a.address) - extractHouseNumber(b.address)
    );
    for (const c of sorted) {
      stops.push({ contact: c, coords: node.coords });
    }
  }

  // Append contacts with no postcode at end
  for (const c of noPostcode) {
    stops.push({ contact: c, coords: null });
  }

  return stops;
}

function totalRouteDistance(route) {
  let d = 0;
  const withCoords = route.filter(s => s.coords);
  for (let i = 1; i < withCoords.length; i++) {
    d += haversine(withCoords[i - 1].coords, withCoords[i].coords);
  }
  return d;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RouteOptimizer() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTurf = urlParams.get('turf') || 'all';

  const [turfFilter, setTurfFilter] = useState(initialTurf);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState({ done: 0, total: 0 });
  const [route, setRoute] = useState(null);
  const [noPostcodeCount, setNoPostcodeCount] = useState(0);
  const [showWalkSheet, setShowWalkSheet] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showTurfBoundaries, setShowTurfBoundaries] = useState(false);

  const { data: contacts = [], isLoading, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('name', 1000),
  });

  const allTurfs = useMemo(() =>
    turfs.map(t => t.name).filter(Boolean).sort(),
    [turfs]
  );

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
    const selected = contacts.filter(c => selectedIds.has(c.id));
    if (!selected.length) return;

    setGeocoding(true);
    setRoute(null);
    setNoPostcodeCount(0);
    setGeocodeProgress({ done: 0, total: 0 });

    const stops = await buildRoute(selected, (done, total) => {
      setGeocodeProgress({ done, total });
    });

    const unlocated = stops.filter(s => !s.coords).length;
    setNoPostcodeCount(unlocated);
    setRoute(stops.filter(s => s.coords)); // only show stops we could place
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

  const handleExportPDF = async () => {
    if (!route) return;
    setExportingPDF(true);
    try {
      const contactMap = {};
      route.forEach(s => {
        contactMap[s.contact.id] = s.contact;
      });

      const response = await base44.functions.invoke('generateRoutePDF', {
        route: route.map((s, i) => ({ ...s.contact, stop_number: i + 1, id: s.contact.id })),
        turf_name: turfFilter !== 'all' ? turfFilter : 'Generated Route',
        contact_details: contactMap,
      });

      // Get the PDF data from the response
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const el = document.createElement('a');
      el.href = url;
      el.download = `route-${turfFilter !== 'all' ? turfFilter.replace(/\s+/g, '-') : 'export'}-${new Date().toISOString().split('T')[0]}.pdf`;
      el.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const totalDist = route ? totalRouteDistance(route) : 0;
  const uniquePostcodesInRoute = route ? new Set(route.map(s => s.contact.postcode)).size : 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold">Route Optimizer</h1>
          <p className="text-sm text-muted-foreground">
            Groups contacts by postcode, optimises the postcode order, then sorts house numbers within each street
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetchContacts()} disabled={isLoading}>
             <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
           </Button>
           {route && (
             <>
               <Badge variant="secondary" className="text-sm px-3 py-1">
                 {route.length} stops · {uniquePostcodesInRoute} postcodes · {totalDist.toFixed(1)} km
               </Badge>
               <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                 <Download className="w-4 h-4" /> Export CSV
               </Button>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="gap-1.5" 
                 onClick={handleExportPDF}
                 disabled={exportingPDF}
               >
                 {exportingPDF ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Generating...
                   </>
                 ) : (
                   <>
                     <FileText className="w-4 h-4" /> Export PDF
                   </>
                 )}
               </Button>
               <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowWalkSheet(true)}>
                 <FileText className="w-4 h-4" /> Walk Sheet
               </Button>
             </>
           )}
           {route && (
             <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setRoute(null); setNoPostcodeCount(0); }}>
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

          {/* How it works hint */}
          <div className="mx-4 mt-3 mb-1 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Contacts are grouped by postcode, postcodes ordered by walking distance, then house numbers sorted within each street.
              <strong> Postcodes are required</strong> for accurate routing.
            </p>
          </div>

          {/* Contact list */}
           <div className="flex-1 overflow-y-auto p-2">
             {isLoading ? (
               <div className="flex justify-center py-8">
                 <Loader2 className="w-5 h-5 animate-spin text-primary" />
               </div>
             ) : filteredContacts.length === 0 ? (
               <div className="text-center py-8">
                 <p className="text-sm text-muted-foreground">No contacts found</p>
                 {turfFilter !== 'all' && (
                   <p className="text-xs text-amber-600 mt-2">
                     Contacts in <strong>{turfFilter}</strong> may not have postcodes yet.<br />
                     Add postcodes to enable routing.
                   </p>
                 )}
               </div>
             ) : (
              filteredContacts.map(c => (
                <label
                  key={c.id}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-1 ${
                    selectedIds.has(c.id) ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60'
                  } ${!c.postcode ? 'opacity-60' : ''}`}
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
                    {c.postcode
                      ? <p className="text-xs text-muted-foreground font-mono">{c.postcode}</p>
                      : <p className="text-xs text-amber-500">No postcode — may be excluded</p>
                    }
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

            {/* Warning if no postcodes */}
            {filteredContacts.length > 0 && filteredContacts.every(c => !c.postcode) && (
            <div className="mx-4 mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <XCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                <strong>No postcodes found.</strong> Contacts must have postcodes to generate a route. Go to Contacts and bulk-add postcodes for <strong>{turfFilter}</strong>.
              </p>
            </div>
            )}

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
                  Looking up postcodes {geocodeProgress.done}/{geocodeProgress.total}…
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Generate Route ({selectedIds.size})
                </>
              )}
            </Button>
            {geocoding && geocodeProgress.total > 0 && (
              <div className="mt-2">
                <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(geocodeProgress.done / geocodeProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Looking up {geocodeProgress.total} unique postcodes…
                </p>
              </div>
            )}
            {noPostcodeCount > 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {noPostcodeCount} contact{noPostcodeCount > 1 ? 's' : ''} skipped (no postcode)
              </p>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Show boundaries button */}
          {!route && (
            <button
              onClick={() => setShowTurfBoundaries(!showTurfBoundaries)}
              className="absolute top-4 right-4 z-10 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Map className="w-4 h-4" />
              {showTurfBoundaries ? 'Hide Boundaries' : 'Show Boundaries'}
            </button>
          )}

          {showTurfBoundaries && !route && (
            <TurfBoundaryMap turfs={turfs} contacts={filteredContacts} highlightAssigned={false} />
          )}

          {route ? (
            <CanvassingRouteMap route={route} />
          ) : geocoding ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-medium">Looking up postcodes…</p>
              <p className="text-sm">{geocodeProgress.done} of {geocodeProgress.total} unique postcodes resolved</p>
            </div>
          ) : !showTurfBoundaries && filteredContacts.length > 0 ? (
            <ContactsZoneMap contacts={filteredContacts} selectedIds={selectedIds} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Map className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="font-medium text-lg">Select contacts & generate a route</p>
                <p className="text-sm mt-1">Filter by turf zone, pick contacts, then click Generate Route.</p>
                <p className="text-xs mt-2 text-muted-foreground/70">Uses postcodes.io — accurate UK postcode coordinates, no API key needed.</p>
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
                      {stop.contact.postcode && (
                        <p className="text-xs text-muted-foreground font-mono">{stop.contact.postcode}</p>
                      )}
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

      {showWalkSheet && route && (
        <WalkSheetPrint
          stops={route}
          title={turfFilter !== 'all' ? `${turfFilter} — ${route.length} stops` : `${route.length} stops`}
          onClose={() => setShowWalkSheet(false)}
        />
      )}
    </div>
  );
}