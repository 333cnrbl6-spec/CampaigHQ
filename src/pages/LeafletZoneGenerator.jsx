import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import WardBoundaryLayer from '@/components/map/WardBoundaryLayer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Loader2, CheckCircle, AlertCircle, Map,
  Trash2, RefreshCw, Layers, Info, ChevronRight,
} from 'lucide-react';

const WARD_CENTER = [53.5163, -2.4474];

const ZONE_COLORS = [
  '#16a34a','#3b82f6','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#f97316','#0ea5e9','#84cc16',
  '#a855f7','#14b8a6','#f43f5e','#6366f1','#78716c',
  '#10b981','#facc15','#fb923c','#c084fc','#34d399',
];

function ZoneLayers({ turfs, selectedId, onSelect }) {
  const leafletZones = turfs.filter(t => /^L\d+$/.test(t.name) && t.geojson);

  return (
    <>
      {leafletZones.map((turf, i) => {
        let geo;
        try { geo = JSON.parse(turf.geojson); } catch { return null; }
        const color = turf.color || ZONE_COLORS[i % ZONE_COLORS.length];
        const isSelected = selectedId === turf.id;
        return (
          <GeoJSON
            key={turf.id}
            data={geo}
            style={{
              color: isSelected ? '#1e40af' : color,
              fillColor: color,
              fillOpacity: isSelected ? 0.5 : 0.3,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{ click: () => onSelect(turf.id) }}
          >
            <Tooltip sticky>
              <strong>{turf.name}</strong><br />
              {turf.contact_count || 0} addresses
            </Tooltip>
          </GeoJSON>
        );
      })}
    </>
  );
}

export default function LeafletZoneGenerator() {
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;
  const queryClient = useQueryClient();

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [maxDoors, setMaxDoors] = useState(200);
  const [clearExisting, setClearExisting] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  const { data: turfs = [], refetch: refetchTurfs } = useQuery({
    queryKey: ['turfs-leaflet-zones', campaignId],
    queryFn: () => base44.entities.Turf.filter({ campaign_id: campaignId }, 'name'),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  const leafletZones = turfs.filter(t => /^L\d+$/.test(t.name));
  const selectedZone = leafletZones.find(t => t.id === selectedZoneId);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.functions.invoke('generateLeafletZones', {
        campaign_id: campaignId,
        max_doors: maxDoors,
        clear_existing: clearExisting,
      });
      setResult(res.data);
      await refetchTurfs();
      queryClient.invalidateQueries(['contacts-turf']);
    } catch (err) {
      setError(err.message || 'Zone generation failed');
    }
    setGenerating(false);
  };

  const handleDeleteZone = async (turf) => {
    if (!confirm(`Delete zone ${turf.name}?`)) return;
    await base44.entities.Turf.delete(turf.id);
    refetchTurfs();
    if (selectedZoneId === turf.id) setSelectedZoneId(null);
  };

  const totalAddresses = leafletZones.reduce((s, t) => s + (t.contact_count || 0), 0);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-primary" />
            <h1 className="font-heading font-bold text-lg">Leaflet Zone Generator</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-generated delivery zones across Tyldesley & Mosley Common and Abram wards
          </p>
        </div>

        {/* Config */}
        <div className="p-4 space-y-4 border-b border-border">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Max doors per zone</label>
            <div className="flex gap-2">
              {[100, 150, 200, 250].map(n => (
                <button
                  key={n}
                  onClick={() => setMaxDoors(n)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    maxDoors === n
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={e => setClearExisting(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs text-muted-foreground">Remove existing L-zones before generating</span>
          </label>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                Queries OpenStreetMap for every address in both wards, clusters them into geographically compact zones respecting ward boundaries, and sorts each zone by street for logical walking order. Takes 2–4 minutes.
              </p>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating || !campaignId}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating zones…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate AI Leaflet Zones
              </>
            )}
          </Button>

          {generating && (
            <div className="space-y-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full w-3/4" />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Fetching addresses from OpenStreetMap → clustering → AI optimising walking order…
              </p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-800">{result.zones_created} zones created</p>
                <p className="text-[10px] text-green-700">{result.total_addresses?.toLocaleString()} addresses · L1–L{result.zones_created}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {leafletZones.length > 0 && (
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{leafletZones.length} zones · {totalAddresses.toLocaleString()} addresses</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => refetchTurfs()}>
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Zone List */}
        <div className="flex-1 overflow-y-auto">
          {leafletZones.length === 0 && !generating ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Map className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">No leaflet zones yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click Generate to create AI-optimised zones</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leafletZones
                .sort((a, b) => {
                  const na = parseInt(a.name.slice(1)), nb = parseInt(b.name.slice(1));
                  return na - nb;
                })
                .map((zone, i) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left ${
                      selectedZoneId === zone.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: zone.color || ZONE_COLORS[i % ZONE_COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{zone.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {zone.contact_count || 0} doors
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{zone.goal || 'Leaflet zone'}</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${selectedZoneId === zone.id ? 'rotate-90' : ''}`} />
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Selected zone detail */}
        {selectedZone && (
          <div className="p-4 border-t border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Zone {selectedZone.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteZone(selectedZone)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background rounded-lg p-2 border border-border">
                <p className="text-muted-foreground">Addresses</p>
                <p className="font-bold text-lg">{selectedZone.contact_count || 0}</p>
              </div>
              <div className="bg-background rounded-lg p-2 border border-border">
                <p className="text-muted-foreground">Target</p>
                <p className="font-bold text-lg">{selectedZone.target_doors || 0}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{selectedZone.notes}</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={WARD_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <WardBoundaryLayer showLabel fitBounds />
          <ZoneLayers
            turfs={leafletZones}
            selectedId={selectedZoneId}
            onSelect={id => setSelectedZoneId(id === selectedZoneId ? null : id)}
          />
        </MapContainer>

        {/* Empty state overlay */}
        {leafletZones.length === 0 && !generating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm border border-border rounded-xl p-6 text-center max-w-sm shadow-lg">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
              <p className="font-semibold text-sm">Generate AI leaflet zones</p>
              <p className="text-xs text-muted-foreground mt-1">
                Both ward boundaries are shown. Click <strong>Generate</strong> in the sidebar to create L1, L2, L3… delivery zones covering all addresses in both wards.
              </p>
            </div>
          </div>
        )}

        {/* Generating overlay */}
        {generating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-background border border-border rounded-xl p-6 text-center max-w-sm shadow-xl">
              <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
              <p className="font-semibold text-sm">Generating zones…</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fetching addresses from OpenStreetMap for both wards, clustering into {maxDoors}-door zones sorted by street. This takes 2–4 minutes.
              </p>
            </div>
          </div>
        )}

        {/* Zone count badge */}
        {leafletZones.length > 0 && (
          <div className="absolute top-4 left-4 bg-background/95 border border-border rounded-xl px-4 py-2 shadow-lg flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Leaflet Zones</p>
              <p className="font-bold text-xl leading-none">{leafletZones.length}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Total Addresses</p>
              <p className="font-bold text-xl leading-none">{totalAddresses.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}