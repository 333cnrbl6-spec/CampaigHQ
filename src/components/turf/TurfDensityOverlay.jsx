import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Renders turf polygons colour-coded by contact density.
 * Calls onSelect(turf) when a zone is clicked.
 */
export default function TurfDensityOverlay({ turfs, contacts, selectedId, onSelect }) {
  const map = useMap();
  const layersRef = useRef({});

  useEffect(() => {
    // Remove old layers
    Object.values(layersRef.current).forEach(l => { try { map.removeLayer(l); } catch {} });
    layersRef.current = {};

    // Build a quick lookup: turf code → contact count
    const countByTurf = {};
    contacts.forEach(c => {
      (c.tags || []).forEach(tag => {
        if (!countByTurf[tag]) countByTurf[tag] = { total: 0, postal: 0, canvassed: 0 };
        countByTurf[tag].total++;
        if (c.tags.includes('Postal Voter')) countByTurf[tag].postal++;
        if (c.canvassed) countByTurf[tag].canvassed++;
      });
    });

    const allCounts = Object.values(countByTurf).map(v => v.total);
    const maxCount = Math.max(...allCounts, 1);

    turfs.forEach(turf => {
      if (!turf.geojson) return;
      try {
        const geo = JSON.parse(turf.geojson);

        // Derive turf code from name (e.g. "TYL1" from "TYL 1 - North Block")
        const code = turf.name.replace(/\s+/g, '').toUpperCase().split('-')[0].trim();
        const stats = countByTurf[code] || { total: 0, postal: 0, canvassed: 0 };
        const density = stats.total / maxCount; // 0-1

        const isSelected = selectedId === turf.id;

        // Colour: low density = light green → high density = deep green
        const g = Math.round(80 + density * 120);
        const fillColor = stats.total === 0 ? '#d1d5db' : `rgb(${Math.round(30 - density * 10)}, ${g}, ${Math.round(60 - density * 20)})`;

        const layer = L.geoJSON(geo, {
          style: {
            color: isSelected ? '#f59e0b' : '#374151',
            fillColor,
            fillOpacity: isSelected ? 0.75 : 0.55,
            weight: isSelected ? 3 : 1.5,
          },
        }).addTo(map);

        const canvassedPct = stats.total > 0 ? Math.round((stats.canvassed / stats.total) * 100) : 0;
        layer.bindTooltip(
          `<div style="min-width:140px">
            <strong style="font-size:13px">${turf.name}</strong><br/>
            <span>📋 ${stats.total.toLocaleString()} contacts</span><br/>
            <span>📬 ${stats.postal} postal voters</span><br/>
            <span>✅ ${canvassedPct}% canvassed</span>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-custom' }
        );

        layer.on('click', () => onSelect(turf));
        layersRef.current[turf.id] = layer;
      } catch {}
    });
  }, [turfs, contacts, selectedId]);

  return null;
}