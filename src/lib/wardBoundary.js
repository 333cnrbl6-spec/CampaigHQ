// Official ward boundary for Tyldesley & Mosley Common
// Source: MySociety MapIt, area ID 167462, GSS E05015009
// Wigan Borough Council — Metropolitan district ward

export const WARD_MAPIT_ID = 167462;
export const WARD_GSS = 'E05015009';
export const WARD_NAME = 'Tyldesley & Mosley Common';

// Geographic centre from MapIt geometry endpoint
export const WARD_CENTER = [53.5163, -2.4474];

// Bounding box (from MapIt)
export const WARD_BOUNDS = {
  north: 53.5287,
  south: 53.5021,
  east: -2.4145,
  west: -2.4899,
};

// Fetch the real ward boundary GeoJSON from MapIt (returns a GeoJSON Feature)
let _cachedBoundary = null;

export async function fetchWardBoundary() {
  if (_cachedBoundary) return _cachedBoundary;
  try {
    const res = await fetch(
      `https://mapit.mysociety.org/area/${WARD_MAPIT_ID}.geojson`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error(`MapIt returned ${res.status}`);
    const geom = await res.json();
    _cachedBoundary = {
      type: 'Feature',
      properties: { name: WARD_NAME, gss: WARD_GSS, mapit_id: WARD_MAPIT_ID },
      geometry: geom,
    };
    return _cachedBoundary;
  } catch (e) {
    console.warn('Ward boundary fetch failed:', e.message);
    return null;
  }
}