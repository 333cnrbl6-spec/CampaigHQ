/**
 * Google Maps URL generator with batch support
 * Handles routes with >25 stops by splitting into multiple batches
 */

const GOOGLE_MAPS_MAX_WAYPOINTS = 25;

/**
 * Generate Google Maps URL(s) for a list of coordinates
 * Returns array of URLs if stops exceed max waypoints
 * Each URL has: origin, up to 23 waypoints, destination
 */
export function generateGoogleMapsUrls(stops, travelMode = 'walking') {
  if (!stops || stops.length === 0) return [];
  
  // Single stop - just open that location
  if (stops.length === 1) {
    const [lat, lon] = stops[0];
    return [`https://www.google.com/maps/search/${lat},${lon}/@${lat},${lon},16z`];
  }

  // Multiple stops - create batches
  const batches = [];
  
  for (let i = 0; i < stops.length; i += GOOGLE_MAPS_MAX_WAYPOINTS - 1) {
    const batch = stops.slice(i, i + GOOGLE_MAPS_MAX_WAYPOINTS);
    
    if (batch.length > 0) {
      const origin = batch[0];
      const destination = batch[batch.length - 1];
      const waypoints = batch.length > 2 
        ? batch.slice(1, -1).map(([lat, lon]) => `${lat},${lon}`).join('|')
        : '';
      
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=${travelMode}`;
      batches.push(url);
    }
  }
  
  return batches;
}

/**
 * Open Google Maps in a new tab
 * If multiple batches, opens each in a separate tab
 */
export function openGoogleMapsUrls(urls) {
  if (!urls || urls.length === 0) return;
  urls.forEach(url => window.open(url, '_blank'));
}

/**
 * Get route batch summary for UI display
 * Returns info about total stops and batch count
 */
export function getRouteBatchInfo(stopCount) {
  if (stopCount === 0) return { batches: 0, info: 'No stops' };
  if (stopCount <= GOOGLE_MAPS_MAX_WAYPOINTS) {
    return { batches: 1, info: `${stopCount} stops (1 route)` };
  }
  
  const batches = Math.ceil(stopCount / (GOOGLE_MAPS_MAX_WAYPOINTS - 1));
  return { batches, info: `${stopCount} stops (${batches} routes)` };
}