import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Approximate centre of Tyldesley & Mosley Common ward
const WARD_CENTER = [53.5135, -2.4670];

// Key locations in the ward
const KEY_LOCATIONS = [
  { name: 'Tyldesley Town Centre', pos: [53.5135, -2.4670], desc: 'Main shopping area — high footfall for leafleting' },
  { name: 'Mosley Common', pos: [53.5050, -2.4480], desc: 'Residential area — key canvassing zone' },
  { name: 'Tyldesley Park / Astley St Park', pos: [53.5160, -2.4620], desc: 'Community space — potential event venue' },
  { name: 'Garrett Hall', pos: [53.5080, -2.4550], desc: 'Residential area' },
  { name: 'Tyldesley Library', pos: [53.5133, -2.4680], desc: 'Community hub — good for surgeries' },
];

export default function WardMap() {
  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Ward Map</h1>
        <p className="text-muted-foreground mt-1">Tyldesley & Mosley Common electoral ward</p>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="h-[600px]">
          <MapContainer center={WARD_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://cartodb.com/">CartoDB</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/positron/{z}/{x}/{y}{r}.png"
            />
            {KEY_LOCATIONS.map((loc) => (
              <Marker key={loc.name} position={loc.pos}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{loc.name}</p>
                    <p className="text-gray-600 mt-1">{loc.desc}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Key Locations List */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {KEY_LOCATIONS.map((loc) => (
          <div key={loc.name} className="bg-card rounded-xl border border-border/50 p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{loc.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{loc.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}