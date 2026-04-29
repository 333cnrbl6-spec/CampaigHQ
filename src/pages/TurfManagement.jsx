import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, useMap, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import TurfSidebar from '../components/turf/TurfSidebar';
import TurfRoutePanel from '../components/turf/TurfRoutePanel';
import BulkAssignDialog from '../components/turf/BulkAssignDialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Layers, Route, Wand2 } from 'lucide-react';

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
      setDrawing(false);
    });

    return () => {
      map.removeLayer(drawnLayersRef.current);
      map.off(L.Draw.Event.CREATED);
      if (drawControlRef.current) map.removeControl(drawControlRef.current);
    };
  }, []);

  useEffect(() => {
    if (drawing) {
      map.addControl(drawControlRef.current);
      // Auto-start polygon draw
      new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon).enable();
    } else {
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

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('-created_date', 100),
  });

  const createTurf = useMutation({
    mutationFn: (data) => base44.entities.Turf.create(data),
    onSuccess: () => queryClient.invalidateQueries(['turfs']),
  });

  const updateTurf = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Turf.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['turfs']),
  });

  const deleteTurf = useMutation({
    mutationFn: (id) => base44.entities.Turf.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['turfs']); setSelectedId(null); },
  });

  const handleShapeCreated = (geojson) => {
    setPendingGeoJSON(geojson);
    setNamePrompt(true);
    setNewName(`Zone ${turfs.length + 1}`);
  };

  const handleConfirmCreate = () => {
    const colorIdx = turfs.length % COLORS.length;
    createTurf.mutate({
      name: newName || `Zone ${turfs.length + 1}`,
      geojson: pendingGeoJSON,
      status: 'unassigned',
      priority: 'normal',
      color: COLORS[colorIdx],
    });
    setNamePrompt(false);
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
        queryClient.invalidateQueries(['turfs']);
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
    <div className="flex h-screen overflow-hidden">
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
          {selectedId && (
            <>
              <Button
                size="sm"
                variant={showRoute ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => { setShowRoute(s => !s); setRouteCoords([]); }}
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
            <div className="bg-card rounded-xl shadow-xl p-6 w-80 space-y-4">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Name this zone
              </h3>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmCreate()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleConfirmCreate}>Create Zone</Button>
                <Button variant="outline" className="flex-1" onClick={() => { setNamePrompt(false); setPendingGeoJSON(null); }}>Cancel</Button>
              </div>
            </div>
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
          <DrawControl onCreated={handleShapeCreated} drawing={drawing} setDrawing={setDrawing} />
          <TurfLayers turfs={turfs} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setShowRoute(false); setRouteCoords([]); }} />
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

        {/* Route panel */}
        {showRoute && selectedId && (
          <TurfRoutePanel
            turf={turfs.find(t => t.id === selectedId)}
            onRouteReady={setRouteCoords}
            onClose={() => { setShowRoute(false); setRouteCoords([]); }}
          />
        )}
      </div>
    </div>
  );
}