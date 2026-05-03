import { useEffect, useRef } from 'react';
import { useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

export default function LeafletDistributionHeatmap({ contacts, turfs, selectedTurfId, visible }) {
  const map = useMap();
  const markersGroupRef = useRef(L.featureGroup());

  useEffect(() => {
    if (!visible || !selectedTurfId) {
      markersGroupRef.current.clearLayers();
      return;
    }

    const selectedTurf = turfs.find(t => t.id === selectedTurfId);
    if (!selectedTurf?.geojson) return;

    try {
      const turfGeo = JSON.parse(selectedTurf.geojson);
      const turfCoords = [];
      
      // Extract turf boundary coordinates
      if (turfGeo.features?.[0]?.geometry?.coordinates) {
        const coords = turfGeo.features[0].geometry.coordinates[0];
        turfCoords.push(...coords);
      } else if (turfGeo.geometry?.coordinates) {
        const coords = turfGeo.geometry.coordinates[0];
        turfCoords.push(...coords);
      }

      // Filter contacts in turf
      const turfContacts = contacts.filter(c => 
        c.latitude && c.longitude && isPointInTurf([c.longitude, c.latitude], turfCoords)
      );

      if (turfContacts.length === 0) return;

      // Clear existing markers
      markersGroupRef.current.clearLayers();

      // Create density grid for heatmap visualization
      const gridSize = 0.002; // ~200m grid cells
      const grid = {};
      const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

      turfContacts.forEach(c => {
        const key = `${Math.floor(c.latitude / gridSize)},${Math.floor(c.longitude / gridSize)}`;
        grid[key] = (grid[key] || 0) + 1;
      });

      const maxDensity = Math.max(...Object.values(grid));

      // Render density circles
      Object.entries(grid).forEach(([key, count]) => {
        const [latIdx, lngIdx] = key.split(',').map(Number);
        const lat = (latIdx + 0.5) * gridSize;
        const lng = (lngIdx + 0.5) * gridSize;
        const intensity = count / maxDensity;
        const colorIdx = Math.floor(intensity * (colors.length - 1));

        const circle = L.circleMarker([lat, lng], {
          radius: 8 + intensity * 12,
          fillColor: colors[colorIdx],
          color: colors[colorIdx],
          weight: 0,
          opacity: 1,
          fillOpacity: 0.3 + intensity * 0.4,
        }).bindTooltip(`${count} contacts`, { permanent: false });

        markersGroupRef.current.addLayer(circle);
      });

      if (!map.hasLayer(markersGroupRef.current)) {
        map.addLayer(markersGroupRef.current);
      }

    } catch (err) {
      console.error('Heatmap error:', err);
    }

    return () => {
      markersGroupRef.current.clearLayers();
    };
  }, [visible, selectedTurfId, contacts, turfs, map]);

  // Simple point-in-polygon algorithm
  const isPointInTurf = (point, polygonCoords) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
      const [xi, yi] = polygonCoords[i];
      const [xj, yj] = polygonCoords[j];

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  };

  return null;
}