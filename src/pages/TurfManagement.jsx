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
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Layers, Route } from 'lucide-react';

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
    // Remove old layers
    Object.values(layersRef.current).forEach(l => map.removeLayer(l));
    layersRef.current = {};

    turfs.forEach(turf => {
      if (!turf.geojson) return;
      try {
        const geo = JSON.parse(turf.geojson);
        const color = turf.color || DEFAULT_COLOR;
        const layer = L.geoJSON(geo, {
          style: {
            color,
            fillColor: color,
            fillOpacity: selectedId === turf.id ? 0.45 : 0.25,
            weight: selectedId === turf.id ? 3 : 2,
          },
        }).addTo(map);

        layer.bindTooltip(
          `<strong>${turf.name}</strong>${turf.assigned_to ? `<br/><span style="font-size:11px">👤 ${turf.assigned_to}</span>` : ''}`,
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
  const [routeCoords, setRouteCoords] = useState([]); // [[lat,lng],...]

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
      color: COLORS[colorIdx],
    });
    setNamePrompt(false);
    setPendingGeoJSON(null);
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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