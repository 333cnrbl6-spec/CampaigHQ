import React, { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import TurfDensityOverlay from '@/components/turf/TurfDensityOverlay';
import TurfDetailPanel from '@/components/turf/TurfDetailPanel';
import { Users, MapPin, MailCheck, Info } from 'lucide-react';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WARD_CENTER = [53.5145, -2.4370];

export default function TurfDensityMap() {
  const [selectedTurf, setSelectedTurf] = useState(null);

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('-created_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-density'],
    queryFn: () => base44.entities.Contact.list('-created_date', 5000),
  });

  const totalContacts = contacts.length;
  const postalContacts = contacts.filter(c => Array.isArray(c.tags) && c.tags.includes('Postal Voter')).length;
  const canvassedContacts = contacts.filter(c => c.canvassed).length;
  const turfZones = turfs.filter(t => t.geojson).length;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Turf Density Map</h1>
        <p className="text-muted-foreground mt-1">
          Electoral register contacts visualised by turf zone — click a zone to inspect contacts
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Contacts', value: totalContacts.toLocaleString(), icon: Users, color: 'text-primary' },
          { label: 'Turf Zones', value: turfZones, icon: MapPin, color: 'text-blue-600' },
          { label: 'Postal Voters', value: postalContacts.toLocaleString(), icon: MailCheck, color: 'text-indigo-600' },
          { label: 'Canvassed', value: `${totalContacts > 0 ? Math.round((canvassedContacts / totalContacts) * 100) : 0}%`, icon: Users, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-8 h-8 ${color} opacity-80`} />
            <div>
              <p className="font-bold text-xl leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend + Map */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Legend bar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-6 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Contact Density:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded block" style={{ background: '#d1d5db' }} />
            No data
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded block" style={{ background: 'rgb(30,100,50)' }} />
            Low
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded block" style={{ background: 'rgb(25,160,55)' }} />
            Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded block" style={{ background: 'rgb(20,200,60)' }} />
            High
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-4 h-4 rounded border-2 border-amber-400 block" />
            Selected zone
          </div>
          {turfs.filter(t => !t.geojson).length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Info className="w-3.5 h-3.5" />
              {turfs.filter(t => !t.geojson).length} zone(s) have no boundaries drawn yet
            </div>
          )}
        </div>

        {/* Map container */}
        <div className="relative" style={{ height: 620 }}>
          <MapContainer
            center={WARD_CENTER}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <TurfDensityOverlay
              turfs={turfs}
              contacts={contacts}
              selectedId={selectedTurf?.id || null}
              onSelect={setSelectedTurf}
            />
          </MapContainer>

          {/* Detail panel */}
          {selectedTurf && (
            <TurfDetailPanel
              turf={selectedTurf}
              contacts={contacts}
              onClose={() => setSelectedTurf(null)}
            />
          )}

          {/* Empty state hint */}
          {turfZones === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl p-6 text-center max-w-sm shadow-lg">
                <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">No turf zones with boundaries yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Draw boundaries in Turf Management to visualise contact density here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}