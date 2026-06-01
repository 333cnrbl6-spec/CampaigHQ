import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import DataFetchError from '@/components/DataFetchError';
import { MapContainer, TileLayer, useMap, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import TurfSidebar from '../components/turf/TurfSidebar';
import TurfRoutePanel from '../components/turf/TurfRoutePanel';
import BulkAssignDialog from '../components/turf/BulkAssignDialog';
import TurfBoundaryMap from '../components/map/TurfBoundaryMap';
import UnassignedStreetsOverlay from '../components/map/UnassignedStreetsOverlay';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Layers, Route, Wand2, Map, Eye, EyeOff, Database, Flame, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import GeocodePanel from '../components/turf/GeocodePanel';
import LeafletDistributionHeatmap from '../components/turf/LeafletDistributionHeatmap';
import WalkingPathOptimizer from '../components/turf/WalkingPathOptimizer';
import WardBoundaryLayer from '../components/map/WardBoundaryLayer';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const WARD_CENTER = [53.5145, -2.4370]; // Tyldesley & Mosley Common
const DEFAULT_COLOR = '#16a34a';
const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

function DrawControl({ onCreated, drawing, setDrawing }) {
  const map = useMap();
  const drawControlRef = useRef(null);
  const drawnLayersRef = useRef(new L.FeatureGroup());
  const activeHandlerRef = useRef(null);

  const stopDrawing = () => {
    if (activeHandlerRef.current) {
      try { activeHandlerRef.current.disable(); } catch {}
      activeHandlerRef.current = null;
    }
    setDrawing(false);
  };

  useEffect(() => {
    map.addLayer(drawnLayersRef.current);

    drawControlRef.current = new L.Control.Draw({
      draw: {
        polygon: { shapeOptions: { color: DEFAULT_COLOR, fillOpacity: 0.25 } },
        rectangle: { shapeOptions: { color: DEFAULT_COLOR, fillOpacity: 0.25 } },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: { featureGroup: drawnLayersRef.current },
    });

    map.on(L.Draw.Event.CREATED, (e) => {
      drawnLayersRef.current.addLayer(e.layer);
      const geojson = JSON.stringify(e.layer.toGeoJSON());
      onCreated(geojson);
      // Explicitly disable handler and stop drawing
      if (activeHandlerRef.current) {
        try { activeHandlerRef.current.disable(); } catch {}
        activeHandlerRef.current = null;
      }
      setDrawing(false);
    });

    // Also catch the draw:drawstop event as a safety net
    map.on(L.Draw.Event.DRAWSTOP, () => {
      activeHandlerRef.current = null;
    });

    // Escape key handler for Mac compatibility
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopDrawing();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      map.removeLayer(drawnLayersRef.current);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.DRAWSTOP);
      document.removeEventListener('keydown', handleKeyDown);
      if (drawControlRef.current) try { map.removeControl(drawControlRef.current); } catch {}
    };
  }, []);

  useEffect(() => {
    if (drawing) {
      map.addControl(drawControlRef.current);
      // Auto-start polygon draw and store handler reference
      const handler = new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon);
      handler.enable();
      activeHandlerRef.current = handler;
    } else {
      // Ensure handler is disabled when drawing is cancelled
      if (activeHandlerRef.current) {
        try { activeHandlerRef.current.disable(); } catch {}
        activeHandlerRef.current = null;
      }
      try { map.removeControl(drawControlRef.current); } catch {}
    }
  }, [drawing]);

  return null;
}

function TurfLayers({ turfs, selectedId, onSelect }) {
  const map = useMap();
  const layersRef = useRef({});

  useEffect(() => {
    Object.values(layersRef.current).forEach(l => map.removeLayer(l));
    layersRef.current = {};

    turfs.forEach(turf => {
      if (!turf.geojson) return;
      try {
        const geo = JSON.parse(turf.geojson);
        const color = turf.color || DEFAULT_COLOR;
        const isSelected = selectedId === turf.id;
        const isUrgent = turf.priority === 'urgent';
        const isHigh = turf.priority === 'high';

        // Progress fill override
        let fillColor = color;
        let fillOpacity = isSelected ? 0.45 : 0.25;
        if (turf.target_doors > 0) {
          const pct = Math.min(1, (turf.doors_knocked || 0) / turf.target_doors);
          fillOpacity = 0.15 + pct * 0.5;
        }

        const dashArray = isUrgent ? '8 4' : isHigh ? '6 3' : null;

        const layer = L.geoJSON(geo, {
          style: {
            color: isUrgent ? '#ef4444' : isHigh ? '#f97316' : color,
            fillColor,
            fillOpacity,
            weight: isSelected ? 4 : isUrgent ? 3 : 2,
            dashArray,
          },
        }).addTo(map);

        const progressText = turf.target_doors > 0
          ? `<br/><span style="font-size:11px">🚪 ${turf.doors_knocked || 0}/${turf.target_doors} doors</span>`
          : '';
        const priorityLabel = turf.priority && turf.priority !== 'normal'
          ? `<br/><span style="font-size:11px;color:${isUrgent ? '#ef4444' : '#f97316'}">⚠️ ${turf.priority.toUpperCase()}</span>`
          : '';
        const goalText = turf.goal ? `<br/><span style="font-size:11px;color:#6b7280">🎯 ${turf.goal}</span>` : '';
        const teamText = turf.assigned_team?.length > 0
          ? `<br/><span style="font-size:11px">👥 ${turf.assigned_team.slice(0,2).join(', ')}${turf.assigned_team.length > 2 ? ` +${turf.assigned_team.length-2}` : ''}</span>`
          : turf.assigned_to
          ? `<br/><span style="font-size:11px">👤 ${turf.assigned_to}</span>`
          : '';

        layer.bindTooltip(
          `<strong>${turf.name}</strong>${priorityLabel}${teamText}${goalText}${progressText}`,
          { sticky: true }
        );

        layer.on('click', () => onSelect(turf.id));
        layersRef.current[turf.id] = layer;
      } catch {}
    });
  }, [turfs, selectedId]);

  return null;
}

export default function TurfManagement() {
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;
  const queryClient = useQueryClient();
  const [drawing, setDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingGeoJSON, setPendingGeoJSON] = useState(null);
  const [namePrompt, setNamePrompt] = useState(false);
  const [newName, setNewName] = useState('');
  const [showRoute, setShowRoute] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [autoDrawing, setAutoDrawing] = useState(false);
  const [showBoundaryMap, setShowBoundaryMap] = useState(false);
  const [showUnassignedPanel, setShowUnassignedPanel] = useState(false);
  const [showGeocodePanel, setShowGeocodePanel] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPathOptimizer, setShowPathOptimizer] = useState(false);
  const [populatingTurf, setPopulatingTurf] = useState(false);
  const [populateResult, setPopulateResult] = useState(null);

  const { data: turfs = [], error: turfError, refetch: refetchTurfs } = useQuery({
    queryKey: ['turfs', campaignId],
    queryFn: () => base44.entities.Turf.filter({ campaign_id: campaignId }, 'name'),
    enabled: !!campaignId,
    staleTime: 120000,
  });

  const { data: contacts = [], error: contactError, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts-turf', campaignId],
    queryFn: () => base44.entities.Contact.filter({ campaign_id: campaignId }, 'name', 500),
    enabled: !!campaignId,
    staleTime: 180000,
  });

  // createTurf kept for any other callers but main flow now uses direct call in handleConfirmCreate
  const createTurf = useMutation({
    mutationFn: (data) => base44.entities.Turf.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => refetchTurfs(),
  });

  const updateTurf = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Turf.update(id, data),
    onSuccess: () => refetchTurfs(),
  });

  const deleteTurf = useMutation({
    mutationFn: (id) => base44.entities.Turf.delete(id),
    onSuccess: () => { refetchTurfs(); setSelectedId(null); },
  });

  const handleShapeCreated = (geojson) => {
    setPendingGeoJSON(geojson);
    setNamePrompt(true);
    setNewName(`Zone ${turfs.length + 1}`);
  };

  const handleConfirmCreate = async (autoPopulate = false) => {
    const colorIdx = turfs.length % COLORS.length;
    const turfName = newName || `Zone ${turfs.length + 1}`;
    
    const result = await base44.entities.Turf.create({
      name: turfName,
      geojson: pendingGeoJSON,
      status: 'unassigned',
      priority: 'normal',
      color: COLORS[colorIdx],
      campaign_id: campaignId,
    });
    
    refetchTurfs();
    setNamePrompt(false);

    if (autoPopulate && pendingGeoJSON) {
      setPopulatingTurf(true);
      setPopulateResult(null);
      try {
        const res = await base44.functions.invoke('populateTurfContacts', {
          geojson: pendingGeoJSON,
          turf_id: result?.id,
          campaign_id: campaignId,
          turf_name: turfName,
        });
        setPopulateResult(res.data);
        refetchContacts();
      } catch (err) {
        setPopulateResult({ error: err.message });
      }
      setPopulatingTurf(false);
    }

    setPendingGeoJSON(null);
  };

  const handleAutoDrawBoundary = async () => {
    const turf = turfs.find(t => t.id === selectedId);
    if (!turf?.file_url) return;
    setAutoDrawing(true);
    try {
      // Get associated leaflet runs (streets) for this turf if no streets on turf itself
      const leafletRuns = await base44.entities.LeafletRun.list('-created_date', 100);
      const streets = leafletRuns
        .filter(r => turf.name && r.notes)
        .map(r => ({ street_name: r.street_name }))
        .slice(0, 20);

      const res = await base44.functions.invoke('extractTurfGeoFromDocx', {
        file_url: turf.file_url,
        turf_id: turf.id,
        streets,
      });

      if (res.data?.geojson) {
        refetchTurfs();
      } else {
        alert('AI boundary generation failed: ' + (res.data?.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setAutoDrawing(false);
  };

  const handleBulkAssign = (turfIds, team) => {
    turfIds.forEach(id => {
      updateTurf.mutate({
        id,
        data: {
          assigned_team: team,
          assigned_to: team[0],
          status: 'assigned',
        },
      });
    });
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      {(turfError || contactError) && (
        <div className="p-4 bg-background border-b border-border">
          <DataFetchError 
            error={turfError || contactError} 
            onRetry={() => {
              refetchTurfs();
              refetchContacts();
            }}
            title="Unable to Load Turf Data" 
          />
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <TurfSidebar
        turfs={turfs}
        selectedId={selectedId}
        onSelect={setSelectedId}
        drawing={drawing}
        onSave={(id, data) => updateTurf.mutate({ id, data })}
        onDelete={(id) => deleteTurf.mutate(id)}
        onBulkAssign={() => setShowBulkAssign(true)}
      />

      <BulkAssignDialog
        open={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        turfs={turfs}
        onAssign={handleBulkAssign}
      />

      {/* Map area */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 bg-card shadow-lg rounded-xl px-4 py-2 border">
          <Button
            size="sm"
            variant={drawing ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setDrawing(d => !d)}
          >
            <Pencil className="w-4 h-4" />
            {drawing ? 'Cancel Draw' : 'Draw Zone'}
          </Button>
          <Button
            size="sm"
            variant={showBoundaryMap ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setShowBoundaryMap(b => !b)}
          >
            <Map className="w-4 h-4" />
            {showBoundaryMap ? 'Hide Boundaries' : 'Show Boundaries'}
          </Button>
          <Button
            size="sm"
            variant={showUnassignedPanel ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setShowUnassignedPanel(p => !p)}
          >
            {showUnassignedPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Unassigned Streets
          </Button>
          <Button
            size="sm"
            variant={showGeocodePanel ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setShowGeocodePanel(p => !p)}
          >
            <Database className="w-4 h-4" />
            Geocode DB
          </Button>
          {selectedId && (
            <>
              <Button
                size="sm"
                variant={showHeatmap ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setShowHeatmap(h => !h)}
              >
                <Flame className="w-4 h-4" />
                {showHeatmap ? 'Hide Heatmap' : 'Heatmap'}
              </Button>
              <Button
                size="sm"
                variant={showRoute ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => { setShowRoute(s => !s); setRouteCoords([]); setShowPathOptimizer(false); }}
              >
                <Route className="w-4 h-4" />
                {showRoute ? 'Hide Route' : 'Walking Route'}
              </Button>
              {turfs.find(t => t.id === selectedId)?.file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={handleAutoDrawBoundary}
                  disabled={autoDrawing}
                >
                  <Wand2 className={`w-4 h-4 ${autoDrawing ? 'animate-spin' : ''}`} />
                  {autoDrawing ? 'AI Drawing…' : turfs.find(t => t.id === selectedId)?.geojson ? 'Redraw AI Boundary' : 'Auto-draw Boundary'}
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => deleteTurf.mutate(selectedId)}
              >
                <Trash2 className="w-4 h-4" /> Delete Selected
              </Button>
            </>
          )}
        </div>

        {/* Name prompt overlay */}
        {namePrompt && (
          <div className="absolute inset-0 z-[2000] bg-black/40 flex items-center justify-center">
            <div className="bg-card rounded-xl shadow-xl p-6 w-96 space-y-4">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Name this zone
              </h3>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmCreate(false)}
                autoFocus
              />
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-900">AI Auto-Populate</span>
                </div>
                <p className="text-xs text-purple-700">Automatically find all street addresses inside this polygon using OpenStreetMap and add them as contacts.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => handleConfirmCreate(true)}>
                  <Sparkles className="w-4 h-4" /> Create Zone + AI Populate Addresses
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleConfirmCreate(false)}>
                  Create Zone Only
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => { setNamePrompt(false); setPendingGeoJSON(null); }}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Populate status overlay */}
        {(populatingTurf || populateResult) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-card border border-border rounded-xl shadow-xl px-5 py-4 flex items-center gap-3 min-w-[320px]">
            {populatingTurf ? (
              <>
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">AI populating addresses…</p>
                  <p className="text-xs text-muted-foreground">Querying OpenStreetMap for streets & postcodes inside the polygon</p>
                </div>
              </>
            ) : populateResult?.error ? (
              <>
                <span className="text-red-500 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-600">Population failed</p>
                  <p className="text-xs text-muted-foreground">{populateResult.error}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPopulateResult(null)}>✕</Button>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">{populateResult?.created || 0} addresses imported!</p>
                  <p className="text-xs text-muted-foreground">{populateResult?.message}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPopulateResult(null)}>✕</Button>
              </>
            )}
          </div>
        )}

        <MapContainer
          center={WARD_CENTER}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <WardBoundaryLayer showLabel />
          <DrawControl onCreated={handleShapeCreated} drawing={drawing} setDrawing={setDrawing} />
          <TurfLayers turfs={turfs} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setShowRoute(false); setRouteCoords([]); setShowHeatmap(false); }} />
          {showHeatmap && selectedId && (
            <LeafletDistributionHeatmap 
              contacts={contacts} 
              turfs={turfs} 
              selectedTurfId={selectedId}
              visible={showHeatmap}
            />
          )}
          {/* Walking route overlay */}
          {routeCoords.length > 1 && (
            <>
              <Polyline positions={routeCoords} color="#f59e0b" weight={3} dashArray="8 6" />
              {routeCoords.map((pos, idx) => (
                <CircleMarker key={idx} center={pos} radius={7} fillColor={idx === 0 ? '#16a34a' : idx === routeCoords.length - 1 ? '#ef4444' : '#f59e0b'} color="#fff" weight={2} fillOpacity={1}>
                  <Tooltip permanent direction="top" offset={[0, -8]} className="text-xs font-bold">{idx + 1}</Tooltip>
                </CircleMarker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Geocode panel */}
        {showGeocodePanel && (
          <GeocodePanel onClose={() => setShowGeocodePanel(false)} />
        )}

        {/* Route panel */}
        {showRoute && selectedId && (
          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-3">
            <TurfRoutePanel
              turf={turfs.find(t => t.id === selectedId)}
              onRouteReady={(coords) => {
                setRouteCoords(coords);
                setShowPathOptimizer(true);
              }}
              onClose={() => { setShowRoute(false); setRouteCoords([]); setShowPathOptimizer(false); }}
            />
            {showPathOptimizer && routeCoords.length > 0 && (
              <WalkingPathOptimizer
                turf={turfs.find(t => t.id === selectedId)}
                contacts={contacts.filter(c => c.latitude && c.longitude)}
                onPathReady={() => {}}
              />
            )}
          </div>
        )}

        {/* Boundary Map Modal */}
        {showBoundaryMap && (
          <div className="absolute inset-4 z-[900] bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
              <h3 className="font-heading font-bold flex items-center gap-2">
                <Map className="w-5 h-5" /> Turf Zone Boundaries
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowBoundaryMap(false)}>✕</Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TurfBoundaryMap 
                turfs={turfs} 
                contacts={contacts}
                onTurfClick={(turf) => {
                  setSelectedId(turf.name);
                  setShowBoundaryMap(false);
                }}
                highlightAssigned={true}
              />
            </div>
          </div>
        )}

        {/* Unassigned Streets Panel */}
        {showUnassignedPanel && (
          <div className="absolute bottom-4 right-4 z-[900] bg-background border border-border rounded-lg shadow-2xl p-4 w-80 max-h-96">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
              <h3 className="font-heading font-bold text-sm">Unassigned Streets</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowUnassignedPanel(false)}>✕</Button>
            </div>
            <div className="overflow-y-auto max-h-80">
              <UnassignedStreetsOverlay contacts={contacts} turfs={turfs} />
            </div>
          </div>
        )}
        </div>
        </div>
        </div>
        );
        }