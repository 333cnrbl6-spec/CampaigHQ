import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchWardBoundary, WARD_NAME } from '@/lib/wardBoundary';

/**
 * Renders the official Tyldesley & Mosley Common ward boundary
 * as a dashed dark-green polygon overlay on a Leaflet map.
 * 
 * Props:
 *   fitBounds {boolean} — if true, auto-fits the map to the boundary on load
 *   opacity   {number}  — fill opacity (default 0)
 *   showLabel {boolean} — show a tooltip with the ward name
 */
export default function WardBoundaryLayer({ fitBounds = false, opacity = 0, showLabel = false }) {
  const map = useMap();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let layer = null;

    fetchWardBoundary().then((feature) => {
      if (!feature) return;

      layer = L.geoJSON(feature, {
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
        layer.bindTooltip(WARD_NAME, {
          permanent: false,
          sticky: true,
          className: 'text-xs font-semibold',
        });
      }

      layer.addTo(map);
      setLoaded(true);

      if (fitBounds) {
        try {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        } catch {}
      }
    });

    return () => {
      if (layer) try { map.removeLayer(layer); } catch {}
    };
  }, [map, fitBounds, opacity, showLabel]);

  return null;
}