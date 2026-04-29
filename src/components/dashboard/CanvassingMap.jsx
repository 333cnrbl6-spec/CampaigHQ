import { useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TurfOverlayControls from './TurfOverlayControls';

// Real postcode coordinates for Tyldesley & Mosley Common ward (M29)
const POSTCODE_COORDS = {
  'M29 8AA': [53.5141, -2.4675], 'M29 8AB': [53.5145, -2.4660], 'M29 8AD': [53.5138, -2.4648],
  'M29 8AE': [53.5150, -2.4690], 'M29 8AF': [53.5132, -2.4710], 'M29 8AG': [53.5155, -2.4630],
  'M29 8AH': [53.5160, -2.4720], 'M29 8AJ': [53.5128, -2.4640], 'M29 8AL': [53.5165, -2.4650],
  'M29 8AN': [53.5122, -2.4665], 'M29 8AP': [53.5170, -2.4680], 'M29 8AQ': [53.5118, -2.4700],
  'M29 8AR': [53.5175, -2.4620], 'M29 8AS': [53.5112, -2.4720], 'M29 8AT': [53.5180, -2.4730],
  'M29 8AU': [53.5108, -2.4610], 'M29 8AW': [53.5185, -2.4600], 'M29 8AX': [53.5104, -2.4740],
  'M29 8AY': [53.5190, -2.4590], 'M29 8AZ': [53.5100, -2.4580], 'M29 8BA': [53.5195, -2.4750],
  'M29 8BB': [53.5096, -2.4760], 'M29 8BD': [53.5200, -2.4570], 'M29 8BE': [53.5092, -2.4770],
  'M29 8BF': [53.5205, -2.4560], 'M29 8BG': [53.5088, -2.4780], 'M29 8BH': [53.5210, -2.4550],
  'M29 8BJ': [53.5084, -2.4790], 'M29 8BL': [53.5215, -2.4800], 'M29 8BN': [53.5080, -2.4540],
  'M29 8BP': [53.5220, -2.4810], 'M29 8BQ': [53.5076, -2.4530], 'M29 8BR': [53.5225, -2.4820],
  'M29 8BS': [53.5072, -2.4520], 'M29 8BT': [53.5230, -2.4530], 'M29 8BU': [53.5068, -2.4510],
  'M29 8BW': [53.5235, -2.4540], 'M29 8BX': [53.5064, -2.4500], 'M29 8BY': [53.5240, -2.4550],
  'M29 8BZ': [53.5060, -2.4490], 'M29 7AA': [53.5245, -2.4560], 'M29 7AB': [53.5056, -2.4480],
  'M29 7AD': [53.5250, -2.4570], 'M29 7AE': [53.5052, -2.4470], 'M29 7AF': [53.5255, -2.4580],
  'M29 7AG': [53.5048, -2.4460], 'M29 7AH': [53.5260, -2.4590], 'M29 7AJ': [53.5044, -2.4450],
  'M29 7AL': [53.5265, -2.4600], 'M29 7AN': [53.5040, -2.4440],
};

function aggregateByPostcode(contacts) {
  const map = {};
  for (const c of contacts) {
    const pc = (c.postcode || '').trim().toUpperCase();
    if (!pc) continue;
    if (!map[pc]) map[pc] = { total: 0, canvassed: 0, supporters: 0, strong: 0, undecided: 0, opposed: 0, postcode: pc };
    map[pc].total++;
    if (c.canvassed) map[pc].canvassed++;
    if (c.support_level === 'strong_supporter' || c.support_level === 'leaning') map[pc].supporters++;
    if (c.support_level === 'strong_supporter') map[pc].strong++;
    if (c.support_level === 'undecided') map[pc].undecided++;
    if (c.support_level === 'opposed') map[pc].opposed++;
  }
  return map;
}

function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) | (rr << 16) | (rg << 8) | rb).toString(16).slice(1)}`;
}

function getCoords(postcode) {
  const pc = (postcode || '').trim().toUpperCase();
  if (POSTCODE_COORDS[pc]) return POSTCODE_COORDS[pc];
  const base = pc.split(' ')[0];
  const match = Object.keys(POSTCODE_COORDS).find(k => k.startsWith(base));
  if (match) return POSTCODE_COORDS[match];
  return null;
}

// Renders turf GeoJSON overlays imperatively to avoid react-leaflet re-mount issues
function TurfOverlays({ turfs, overlayStates }) {
  const map = useMap();
  const layersRef = useRef({});

  useEffect(() => {
    // Remove all existing overlay layers
    Object.values(layersRef.current).forEach(l => { try { map.removeLayer(l); } catch {} });
    layersRef.current = {};

    turfs.forEach(turf => {
      const state = overlayStates[turf.id];
      if (!state?.visible || !turf.geojson) return;
      try {
        const geo = JSON.parse(turf.geojson);
        const color = turf.color || '#16a34a';
        const layer = L.geoJSON(geo, {
          style: {
            color,
            fillColor: color,
            fillOpacity: state.opacity,
            weight: 2,
            opacity: 0.7,
          },
        });
        layer.bindTooltip(`<strong>${turf.name}</strong>`, { sticky: true });
        layer.addTo(map);
        layersRef.current[turf.id] = layer;
      } catch {}
    });

    return () => {
      Object.values(layersRef.current).forEach(l => { try { map.removeLayer(l); } catch {} });
      layersRef.current = {};
    };
  }, [turfs, overlayStates, map]);

  return null;
}

const MODES = [
  { key: 'canvassing', label: 'Canvassing Progress' },
  { key: 'supporters', label: 'Supporter Concentration' },
  { key: 'outreach',   label: 'Outreach Priority' },
];

export default function CanvassingMap({ contacts = [] }) {
  const [mode, setMode] = useState('canvassing');
  const [overlayStates, setOverlayStates] = useState({});

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('-created_date', 100),
  });

  const aggregated = useMemo(() => aggregateByPostcode(contacts), [contacts]);
  const totalContacts = contacts.length;
  const totalCanvassed = contacts.filter(c => c.canvassed).length;
  const pct = totalContacts > 0 ? Math.round((totalCanvassed / totalContacts) * 100) : 0;
  const entries = Object.values(aggregated);
  const maxStrong = useMemo(() => Math.max(1, ...entries.map(e => e.strong)), [entries]);
  const maxUndecided = useMemo(() => Math.max(1, ...entries.map(e => e.undecided + e.opposed)), [entries]);

  function getMarkerProps(entry) {
    const canvassRatio = entry.total > 0 ? entry.canvassed / entry.total : 0;
    const strongRatio = entry.strong / maxStrong;
    const needRatio = (entry.undecided + entry.opposed) / maxUndecided;

    if (mode === 'canvassing') {
      let color;
      if (canvassRatio >= 0.8) color = '#22c55e';
      else if (canvassRatio >= 0.3) color = '#f59e0b';
      else color = '#ef4444';
      return { color, fillOpacity: 0.75 };
    }
    if (mode === 'supporters') {
      const color = lerpColor('#94a3b8', '#15803d', strongRatio);
      return { color, fillOpacity: 0.5 + strongRatio * 0.45 };
    }
    const color = lerpColor('#3b82f6', '#ef4444', needRatio);
    return { color, fillOpacity: 0.5 + needRatio * 0.45 };
  }

  const legends = {
    canvassing: [
      { color: '#22c55e', label: 'Fully canvassed (≥80%)' },
      { color: '#f59e0b', label: 'Partially canvassed' },
      { color: '#ef4444', label: 'Not yet visited' },
    ],
    supporters: [
      { color: '#15803d', label: 'High strong supporters' },
      { color: '#6dbb8a', label: 'Some supporters' },
      { color: '#94a3b8', label: 'Few/no supporters' },
    ],
    outreach: [
      { color: '#ef4444', label: 'High outreach need' },
      { color: '#a78bfa', label: 'Moderate need' },
      { color: '#3b82f6', label: 'Low need' },
    ],
  };

  const handleToggle = (turfId) => {
    setOverlayStates(prev => ({
      ...prev,
      [turfId]: {
        visible: !prev[turfId]?.visible,
        opacity: prev[turfId]?.opacity ?? 0.4,
      },
    }));
  };

  const handleOpacityChange = (turfId, opacity) => {
    setOverlayStates(prev => ({
      ...prev,
      [turfId]: { ...prev[turfId], opacity },
    }));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map(m => (
          <Button
            key={m.key}
            size="sm"
            variant={mode === m.key ? 'default' : 'outline'}
            onClick={() => setMode(m.key)}
            className="text-xs h-7 px-3"
          >
            {m.label}
          </Button>
        ))}
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs">{totalCanvassed} / {totalContacts} canvassed ({pct}%)</Badge>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {legends[mode].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color, opacity: 0.9 }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {mode === 'outreach' && (
        <p className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">
          <strong>Outreach Priority:</strong> Red postcodes have the highest concentration of undecided &amp; opposed contacts — focus canvassing efforts here.
        </p>
      )}
      {mode === 'supporters' && (
        <p className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2">
          <strong>Supporter Concentration:</strong> Darker green postcodes have the most Strong Supporter contacts relative to the ward.
        </p>
      )}

      {/* Map + overlay controls side by side on wider screens */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="rounded-lg overflow-hidden border border-border flex-1" style={{ height: 420 }}>
          <MapContainer
            center={[53.5141, -2.4675]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Turf overlays (imported / legacy map data) */}
            <TurfOverlays turfs={turfs} overlayStates={overlayStates} />
            <LayerGroup>
              {entries.map((entry) => {
                const coords = getCoords(entry.postcode);
                if (!coords) return null;
                const { color, fillOpacity } = getMarkerProps(entry);
                const radius = Math.max(7, Math.min(20, 7 + entry.total / 6));
                const canvassRatio = entry.total > 0 ? entry.canvassed / entry.total : 0;
                const strongPct = entry.total > 0 ? Math.round((entry.strong / entry.total) * 100) : 0;

                return (
                  <CircleMarker
                    key={entry.postcode}
                    center={coords}
                    radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity, weight: 2, opacity: 0.9 }}
                  >
                    <Popup>
                      <div className="text-sm font-sans min-w-[180px] space-y-1">
                        <p className="font-bold text-base">{entry.postcode}</p>
                        <p>Total contacts: <strong>{entry.total}</strong></p>
                        <p>Canvassed: <strong>{entry.canvassed}</strong> ({Math.round(canvassRatio * 100)}%)</p>
                        <hr className="my-1" />
                        <p>Strong Supporters: <strong className="text-green-700">{entry.strong}</strong> ({strongPct}%)</p>
                        <p>Leaning: <strong>{entry.supporters - entry.strong}</strong></p>
                        <p>Undecided: <strong className="text-amber-600">{entry.undecided}</strong></p>
                        <p>Opposed: <strong className="text-red-600">{entry.opposed}</strong></p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </MapContainer>
        </div>

        {/* Overlay controls panel */}
        <div className="lg:w-56 flex-shrink-0">
          <TurfOverlayControls
            turfs={turfs}
            overlayStates={overlayStates}
            onToggle={handleToggle}
            onOpacityChange={handleOpacityChange}
          />
          {turfs.filter(t => t.geojson).length === 0 && (
            <p className="text-xs text-muted-foreground p-2">
              No map zones imported yet. Use <strong>Turf Management</strong> or <strong>Legacy Map Import</strong> to add zones.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}