// Official ward boundaries for the campaign area
// Source: MySociety MapIt

export const WARDS = [
  {
    mapit_id: 167462,
    gss: 'E05015009',
    name: 'Tyldesley & Mosley Common',
    center: [53.5163, -2.4474],
  },
  {
    mapit_id: 167449,
    gss: 'E05014989',
    name: 'Abram',
    center: [53.5100, -2.5900],
  },
];

// Primary ward (kept for backward compatibility)
export const WARD_MAPIT_ID = WARDS[0].mapit_id;
export const WARD_GSS = WARDS[0].gss;
export const WARD_NAME = WARDS[0].name;
export const WARD_CENTER = WARDS[0].center;

// Bounding box (union of both wards, approximate)
export const WARD_BOUNDS = {
  north: 53.5350,
  south: 53.4900,
  east: -2.3900,
  west: -2.6200,
};

// Per-ward boundary cache
const _cache = {};

export async function fetchWardBoundaryById(mapit_id) {
  if (_cache[mapit_id]) return _cache[mapit_id];
  try {
    const ward = WARDS.find(w => w.mapit_id === mapit_id);
    const res = await fetch(
      `https://mapit.mysociety.org/area/${mapit_id}.geojson`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`MapIt returned ${res.status}`);
    const geom = await res.json();
    _cache[mapit_id] = {
      type: 'Feature',
      properties: { name: ward?.name || String(mapit_id), gss: ward?.gss, mapit_id },
      geometry: geom,
    };
    return _cache[mapit_id];
  } catch (e) {
    console.warn(`Ward boundary fetch failed for ${mapit_id}:`, e.message);
    return null;
  }
}

// Backward-compatible single fetch (Tyldesley & Mosley Common)
export async function fetchWardBoundary() {
  return fetchWardBoundaryById(WARD_MAPIT_ID);
}

// Fetch all ward boundaries
export async function fetchAllWardBoundaries() {
  return Promise.all(WARDS.map(w => fetchWardBoundaryById(w.mapit_id)));
}