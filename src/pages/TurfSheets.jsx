import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Printer, Users, MapPin, ChevronDown, ChevronRight, CheckCircle2, ArrowLeft, Footprints } from 'lucide-react';
import TurfSheetPrint from '../components/turf/TurfSheetPrint';
import LeafletRunSheet from '../components/leaflet/LeafletRunSheet';
import PrePrintBriefing from '../components/print/PrePrintBriefing';

const supportBadge = {
  strong_supporter: { label: 'Strong', cls: 'bg-green-100 text-green-800 border-green-200' },
  leaning:          { label: 'Leaning', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  undecided:        { label: 'Undecided', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  opposed:          { label: 'Opposed', cls: 'bg-red-100 text-red-800 border-red-200' },
  unknown:          { label: 'Unknown', cls: 'bg-muted text-muted-foreground border-border' },
};

// Extract the street name from an address string
function extractStreet(address = '') {
  // Take everything after house number (digits at start), or just first 2 words
  const stripped = address.replace(/^\d+[a-zA-Z]?\s*/, '').trim();
  return stripped || address;
}

export default function TurfSheets() {
  // Support direct /turf-sheets?turf_id=xxx for leaflet-run-based sheet
  // Support /turf-sheets?route_ids=id1,id2,... to pre-select contacts from route optimizer
  const urlParams = new URLSearchParams(window.location.search);
  const turfIdParam = urlParams.get('turf_id');
  const routeIdsParam = urlParams.get('route_ids');
  const routeIds = routeIdsParam ? routeIdsParam.split(',').filter(Boolean) : null;

  const [search, setSearch] = useState('');
  const [filterSupport, setFilterSupport] = useState('all');
  const [selectedIds, setSelectedIds] = useState(() =>
    routeIds ? new Set(routeIds) : new Set()
  );
  const [expandedStreets, setExpandedStreets] = useState(new Set());
  const [groupBy, setGroupBy] = useState('street'); // 'street' | 'postcode'
  const [showBriefing, setShowBriefing] = useState(!!routeIds);
  const [showPrint, setShowPrint] = useState(false);
  const [briefingData, setBriefingData] = useState(null);
  const [sheetTitle, setSheetTitle] = useState(routeIds ? 'Optimised Route Sheet' : 'Canvassing Turf Sheet');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('-created_date', 100),
  });

  const { data: leafletRuns = [] } = useQuery({
    queryKey: ['leaflet-runs'],
    queryFn: () => base44.entities.LeafletRun.list('-created_date', 500),
  });

  const filtered = useMemo(() => contacts.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.postcode?.toLowerCase().includes(search.toLowerCase());
    const matchesSupport = filterSupport === 'all' || c.support_level === filterSupport;
    return matchesSearch && matchesSupport;
  }), [contacts, search, filterSupport]);

  // Group contacts
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(c => {
      const key = groupBy === 'postcode'
        ? (c.postcode?.toUpperCase() || 'No Postcode')
        : extractStreet(c.address);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    // Sort groups and contacts within each group by house number
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([street, cts]) => ({
        street,
        contacts: cts.sort((a, b) => {
          const numA = parseInt(a.address || '0');
          const numB = parseInt(b.address || '0');
          return numA - numB;
        }),
      }));
  }, [filtered, groupBy]);

  const selectedContacts = useMemo(() => {
    if (routeIds) {
      // Preserve route order
      const map = Object.fromEntries(contacts.map(c => [c.id, c]));
      return routeIds.map(id => map[id]).filter(Boolean);
    }
    return contacts.filter(c => selectedIds.has(c.id));
  }, [contacts, selectedIds, routeIds]);

  const toggleContact = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleStreet = (street, streetContacts) => {
    const allSelected = streetContacts.every(c => selectedIds.has(c.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      streetContacts.forEach(c => allSelected ? next.delete(c.id) : next.add(c.id));
      return next;
    });
  };

  const toggleExpandStreet = (street) => {
    setExpandedStreets(prev => {
      const next = new Set(prev);
      next.has(street) ? next.delete(street) : next.add(street);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map(c => c.id)));
  const clearAll = () => setSelectedIds(new Set());

  // If turf_id is in URL, show briefing → leaflet-run based sheet
  if (turfIdParam) {
    const turf = turfs.find(t => t.id === turfIdParam);
    const streets = leafletRuns.filter(r => r.turf_id === turfIdParam);
    const totalH = streets.reduce((s, r) => s + (r.total_houses || 0), 0);
    const totalP = streets.reduce((s, r) => s + (r.postal_voter_houses || 0), 0);

    if (!briefingData) {
      return (
        <PrePrintBriefing
          mode="leaflet"
          defaultTitle={turf ? `${turf.name} — Leaflet Sheet` : 'Leaflet Distribution Sheet'}
          streetCount={streets.length}
          totalHouses={totalH}
          onBack={() => window.history.back()}
          onConfirm={(data) => setBriefingData(data)}
        />
      );
    }

    return (
      <LeafletRunSheet
        turf={turf}
        streets={streets}
        briefing={briefingData}
        onBack={() => setBriefingData(null)}
      />
    );
  }

  if (showBriefing) {
    return (
      <PrePrintBriefing
        mode="canvassing"
        defaultTitle={sheetTitle}
        contactCount={selectedContacts.length}
        streetCount={
          new Set(selectedContacts.map(c => c.address?.replace(/^\d+[a-zA-Z]?\s*/, '').trim() || c.address)).size
        }
        onBack={() => {
          setShowBriefing(false);
          if (routeIds) window.history.back();
        }}
        onConfirm={(data) => {
          setBriefingData(data);
          setShowBriefing(false);
          setShowPrint(true);
        }}
      />
    );
  }

  if (showPrint) {
    return (
      <TurfSheetPrint
        contacts={selectedContacts}
        title={sheetTitle}
        groupBy={groupBy}
        briefing={briefingData}
        onBack={() => { setShowPrint(false); setBriefingData(null); }}
      />
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      {routeIds && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary font-medium">
          <Footprints className="w-4 h-4 flex-shrink-0" />
          <span>Route imported from Route Optimizer — {routeIds.length} contacts pre-selected in walking order</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Turf Sheets</h1>
          <p className="text-muted-foreground mt-1">Select contacts to build a printer-friendly canvassing route sheet</p>
        </div>
        <Button
          className="gap-2"
          disabled={selectedIds.size === 0}
          onClick={() => setShowBriefing(true)}
        >
          <Printer className="w-4 h-4" />
          Print Sheet ({selectedIds.size})
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, address, postcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterSupport} onValueChange={setFilterSupport}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Support level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="strong_supporter">Strong Supporter</SelectItem>
            <SelectItem value="leaning">Leaning</SelectItem>
            <SelectItem value="undecided">Undecided</SelectItem>
            <SelectItem value="opposed">Opposed</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[155px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="street">Group by Street</SelectItem>
            <SelectItem value="postcode">Group by Postcode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sheet title input */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sheet title:</label>
        <Input value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} className="max-w-xs" />
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={selectAll}>Select All ({filtered.length})</Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
        </div>
      </div>

      {/* Grouped contact list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No contacts found.</div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ street, contacts: cts }) => {
            const allSelected = cts.every(c => selectedIds.has(c.id));
            const someSelected = cts.some(c => selectedIds.has(c.id));
            const isExpanded = expandedStreets.has(street);

            return (
              <div key={street} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                {/* Street header */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggleExpandStreet(street)}>
                  <Checkbox
                    checked={allSelected}
                    data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                    onCheckedChange={() => toggleStreet(street, cts)}
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0"
                  />
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-sm flex-1">{street}</span>
                  <Badge variant="secondary" className="text-xs gap-1 flex items-center">
                    <Users className="w-3 h-3" /> {cts.length}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {cts.filter(c => selectedIds.has(c.id)).length} selected
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>

                {/* Contacts */}
                {isExpanded && (
                  <div className="border-t border-border/50 divide-y divide-border/30">
                    {cts.map(c => (
                      <div key={c.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors ${selectedIds.has(c.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleContact(c.id)}>
                        <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleContact(c.id)} onClick={e => e.stopPropagation()} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{c.name}</span>
                            {c.registered_voter && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            )}
                            <Badge variant="secondary"
                              className={`text-xs border ${(supportBadge[c.support_level] || supportBadge.unknown).cls}`}>
                              {(supportBadge[c.support_level] || supportBadge.unknown).label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.address}{c.postcode ? `, ${c.postcode}` : ''}</p>
                        </div>
                        {c.phone && <span className="text-xs text-muted-foreground hidden sm:block">{c.phone}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}