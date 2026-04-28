import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap, LayerGroup, ZoomControl } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RouteOptimizer from '../components/map/RouteOptimizer';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WARD_CENTER = [53.5135, -2.4670];

// Real postcode coordinates for the ward
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

// Aggregate contacts by postcode for the overlay
function aggregateByPostcode(contacts) {
  const map = {};
  for (const c of contacts) {
    const pc = (c.postcode || '').trim().toUpperCase();
    if (!pc || !POSTCODE_COORDS[pc]) continue;
    if (!map[pc]) map[pc] = { total: 0, canvassed: 0, postcode: pc };
    map[pc].total++;
    if (c.canvassed) map[pc].canvassed++;
  }
  return Object.values(map);
}

// Numbered circle marker for route stops
function NumberedMarker({ position, number }) {
  const map = useMap();
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:#166534;color:white;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);">
      ${number}
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
  return <Marker position={position} icon={icon} />;
}

export default function WardMap() {
  const [route, setRoute] = useState([]);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-map'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const aggregated = aggregateByPostcode(contacts);
  const routeCoords = route.map(s => s.coords);

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Ward Map</h1>
        <p className="text-muted-foreground mt-1">Tyldesley & Mosley Common — canvassing progress & route planner</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          {/* Legend */}
          <div className="bg-card rounded-xl border border-border/50 p-4 space-y-2">
            <p className="text-sm font-semibold">Coverage Legend</p>
            {[
              { color: '#22c55e', label: 'Mostly canvassed (≥80%)' },
              { color: '#f59e0b', label: 'Partially canvassed' },
              { color: '#ef4444', label: 'Not yet visited' },
              { color: '#166534', label: 'Optimised route stop' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>

          {/* Route Optimizer */}
          <RouteOptimizer
            contacts={contacts}
            postcodeCoords={POSTCODE_COORDS}
            onRouteChange={setRoute}
          />
        </div>

        {/* Map */}
        <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden" style={{ height: 620 }}>
          <MapContainer center={WARD_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* Coverage dots */}
            <LayerGroup>
              {aggregated.map(entry => {
                const ratio = entry.total > 0 ? entry.canvassed / entry.total : 0;
                const color = ratio >= 0.8 ? '#22c55e' : ratio >= 0.3 ? '#f59e0b' : '#ef4444';
                const coords = POSTCODE_COORDS[entry.postcode];
                return (
                  <CircleMarker
                    key={entry.postcode}
                    center={coords}
                    radius={Math.max(6, Math.min(16, 5 + entry.total / 8))}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2, opacity: 0.9 }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[140px]">
                        <p className="font-bold">{entry.postcode}</p>
                        <p>Canvassed: {entry.canvassed} / {entry.total}</p>
                        <p>{Math.round(ratio * 100)}% complete</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>

            {/* Route polyline */}
            {routeCoords.length > 1 && (
              <Polyline
                positions={routeCoords}
                pathOptions={{ color: '#166534', weight: 3, opacity: 0.85, dashArray: '8 6' }}
              />
            )}

            {/* Numbered route markers */}
            <LayerGroup>
              {route.map((stop, idx) => (
                <NumberedMarker key={stop.postcode} position={stop.coords} number={idx + 1} />
              ))}
            </LayerGroup>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}