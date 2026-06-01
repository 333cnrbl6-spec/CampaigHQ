import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchAllWardBoundaries } from '@/lib/wardBoundary';

/**
 * Renders ALL campaign ward boundaries (Tyldesley & Mosley Common + Abram)
 * as dashed dark-green polygon overlays on a Leaflet map.
 *
 * Props:
 *   fitBounds {boolean} — auto-fit map to the combined bounds on load
 *   opacity   {number}  — fill opacity (default 0)
 *   showLabel {boolean} — show a tooltip with each ward name
 */
export default function WardBoundaryLayer({ fitBounds = false, opacity = 0, showLabel = false }) {
  const map = useMap();

  useEffect(() => {
    const layers = [];

    fetchAllWardBoundaries().then((features) => {
      const validFeatures = features.filter(Boolean);
      if (validFeatures.length === 0) return;

      for (const feature of validFeatures) {
        const layer = L.geoJSON(feature, {
          style: {
            color: '#00612B',
            weight: 3,
            dashArray: '10 6',
            fillColor: '#00612B',
            fillOpacity: opacity,
            opacity: 0.9,
          },
        });

        if (showLabel) {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            sticky: true,
            className: 'text-xs font-semibold',
          });
        }

        layer.addTo(map);
        layers.push(layer);
      }

      if (fitBounds && layers.length > 0) {
        try {
          const group = L.featureGroup(layers);
          map.fitBounds(group.getBounds(), { padding: [20, 20] });
        } catch {}
      }
    });

    return () => {
      layers.forEach(l => { try { map.removeLayer(l); } catch {} });
    };
  }, [map, fitBounds, opacity, showLabel]);

  return null;
}