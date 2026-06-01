import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const WARD_MAPIT_IDS = [167462, 167449]; // Tyldesley & Mosley Common + Abram
const WARD_NAMES    = ['Tyldesley & Mosley Common', 'Abram'];
const MAX_DOORS_PER_ZONE = 200;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// ─── MapIt ────────────────────────────────────────────────────────────────────

async function fetchWardPolygon(mapit_id) {
  const res = await fetch(`https://mapit.mysociety.org/area/${mapit_id}.geojson`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MapIt ${res.status} for area ${mapit_id}`);
  return res.json();
}

async function fetchAllWardRings() {
  const rings = [];
  for (const id of WARD_MAPIT_IDS) {
    try {
      const geom = await fetchWardPolygon(id);
      rings.push(getOuterRing(geom));
    } catch (e) {
      console.warn(`Ward ${id} failed:`, e.message);
    }
  }
  return rings;
}

function getOuterRing(geom) {
  if (geom.type === 'Polygon') return geom.coordinates[0];
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.reduce((best, poly) =>
      poly[0].length > best.length ? poly[0] : best, []);
  }
  throw new Error('Unsupported geometry: ' + geom.type);
}

// ─── Overpass ─────────────────────────────────────────────────────────────────

function buildPolyString(ring) {
  // ring = [[lon, lat], ...] — Overpass wants "lat lon lat lon ..."
  return ring.map(([lon, lat]) => `${lat} ${lon}`).join(' ');
}

async function overpassPost(query, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CampaignApp/1.0 (political canvassing)',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) {
      const data = await res.json();
      return data.elements || [];
    }
    if (res.status === 429 && attempt < retries) {
      const wait = attempt * 3000;
      console.warn(`Overpass 429 (attempt ${attempt}), waiting ${wait}ms…`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    const txt = await res.text();
    console.error('Overpass error:', txt.slice(0, 400));
    throw new Error(`Overpass ${res.status}`);
  }
}

async function fetchAddressesInWard(ring) {
  const polyStr = buildPolyString(ring);
  const query = `[out:json][timeout:60];(node["addr:housenumber"]["addr:street"](poly:"${polyStr}");way["addr:housenumber"]["addr:street"](poly:"${polyStr}"););out center tags;`;
  console.log('Querying Overpass for addresses (POST)…');
  return overpassPost(query);
}

async function fetchStreetsInWard(ring) {
  const polyStr = buildPolyString(ring);
  const query = `[out:json][timeout:30];(way["highway"~"residential|tertiary|secondary|primary|unclassified"]["name"](poly:"${polyStr}"););out tags center;`;
  try { return await overpassPost(query); } catch { return []; }
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

// Ray-casting point-in-polygon (ring = [[lon,lat],...])
function pointInPolygon(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Graham scan convex hull → closed GeoJSON ring [[lon,lat],...]
function convexHullRing(points) {
  if (points.length < 3) {
    const lats = points.map(p => p.lat), lons = points.map(p => p.lon);
    const pad = 0.0005;
    const minLat = Math.min(...lats) - pad, maxLat = Math.max(...lats) + pad;
    const minLon = Math.min(...lons) - pad, maxLon = Math.max(...lons) + pad;
    return [[minLon, minLat],[maxLon, minLat],[maxLon, maxLat],[minLon, maxLat],[minLon, minLat]];
  }
  const sorted = [...points].sort((a, b) => a.lon !== b.lon ? a.lon - b.lon : a.lat - b.lat);
  const cross = (o, a, b) => (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon);
  const lower = [], upper = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop(); upper.pop();
  const hull = [...lower, ...upper];
  // Pad outward ~50m from centroid
  const cLat = hull.reduce((s, p) => s + p.lat, 0) / hull.length;
  const cLon = hull.reduce((s, p) => s + p.lon, 0) / hull.length;
  const PAD = 0.0006;
  const ring = hull.map(p => {
    const dLat = p.lat - cLat, dLon = p.lon - cLon;
    const mag = Math.sqrt(dLat * dLat + dLon * dLon) || 0.0001;
    return [p.lon + (dLon / mag) * PAD, p.lat + (dLat / mag) * PAD];
  });
  ring.push(ring[0]);
  return ring;
}

// ─── Clustering ───────────────────────────────────────────────────────────────

function clusterIntoZones(addresses, maxDoorsPerZone) {
  if (addresses.length === 0) return [];

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const a of addresses) {
    if (a.lat < minLat) minLat = a.lat;
    if (a.lat > maxLat) maxLat = a.lat;
    if (a.lon < minLon) minLon = a.lon;
    if (a.lon > maxLon) maxLon = a.lon;
  }

  const cellTarget = Math.max(10, Math.floor(maxDoorsPerZone / 4));
  const gridDim = Math.max(1, Math.ceil(Math.sqrt(addresses.length / cellTarget)));
  const latStep = (maxLat - minLat) / gridDim || 0.001;
  const lonStep = (maxLon - minLon) / gridDim || 0.001;

  const cellMap = {};
  for (const a of addresses) {
    const row = Math.min(Math.floor((a.lat - minLat) / latStep), gridDim - 1);
    const col = Math.min(Math.floor((a.lon - minLon) / lonStep), gridDim - 1);
    const key = `${row}_${col}`;
    if (!cellMap[key]) cellMap[key] = { row, col, addresses: [] };
    cellMap[key].addresses.push(a);
  }

  // Sort cells north-to-south, west-to-east
  const cells = Object.values(cellMap).sort((a, b) =>
    b.row !== a.row ? b.row - a.row : a.col - b.col
  );

  const zones = [];
  let current = [];
  for (const cell of cells) {
    const cellAddrs = cell.addresses;
    // Oversized cell → split first
    if (cellAddrs.length > maxDoorsPerZone) {
      if (current.length > 0) { zones.push([...current]); current = []; }
      for (let ci = 0; ci < cellAddrs.length; ci += maxDoorsPerZone) {
        zones.push(cellAddrs.slice(ci, ci + maxDoorsPerZone));
      }
      continue;
    }
    if (current.length + cellAddrs.length > maxDoorsPerZone && current.length > 0) {
      zones.push([...current]);
      current = [];
    }
    current.push(...cellAddrs);
  }
  if (current.length > 0) zones.push(current);

  // Merge tiny zones (< 10 addresses) into the previous zone if it fits,
  // otherwise into the next zone, to avoid single-address zones
  const MIN_ZONE = 10;
  const merged = [];
  for (let z = 0; z < zones.length; z++) {
    if (zones[z].length < MIN_ZONE) {
      if (merged.length > 0 && merged.at(-1).length + zones[z].length <= maxDoorsPerZone) {
        merged.at(-1).push(...zones[z]);
      } else if (z + 1 < zones.length && zones[z + 1].length + zones[z].length <= maxDoorsPerZone) {
        zones[z + 1] = [...zones[z], ...zones[z + 1]];
      } else {
        merged.push(zones[z]); // can't merge, keep as-is
      }
    } else {
      merged.push(zones[z]);
    }
  }
  return merged;
}

// Sort by street name then house number (odd/even aware)
function sortAddressesForWalking(addresses) {
  return [...addresses].sort((a, b) => {
    const streetCmp = a.street.localeCompare(b.street);
    if (streetCmp !== 0) return streetCmp;
    return (parseInt(a.houseNumber) || 0) - (parseInt(b.houseNumber) || 0);
  });
}

// ─── Zone colours ─────────────────────────────────────────────────────────────

const ZONE_COLORS = [
  '#16a34a','#3b82f6','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#f97316','#0ea5e9','#84cc16',
  '#a855f7','#14b8a6','#f43f5e','#6366f1','#78716c',
  '#10b981','#facc15','#fb923c','#c084fc','#34d399',
];

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_id, max_doors = MAX_DOORS_PER_ZONE, clear_existing = false } = body;

    if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

    console.log(`Generating leaflet zones: campaign=${campaign_id} max_doors=${max_doors}`);

    // ── 1. Ward boundaries ────────────────────────────────────────────────────
    console.log('Fetching ward boundaries…');
    const wardRings = await fetchAllWardRings();
    if (wardRings.length === 0) throw new Error('Could not fetch any ward boundaries from MapIt');
    console.log(`${wardRings.length} ward boundaries fetched`);

    // ── 2. Per-ward address fetch + clustering ────────────────────────────────
    const allZoneGroups = []; // [{addresses[], wardName}]

    for (let wi = 0; wi < wardRings.length; wi++) {
      const ring     = wardRings[wi];
      const wardName = WARD_NAMES[wi] || `Ward ${wi + 1}`;
      const seen     = new Set();
      const wardAddresses = [];

      // Fetch addresses and streets in parallel
      const [elements, streets] = await Promise.all([
        fetchAddressesInWard(ring),
        fetchStreetsInWard(ring),
      ]);
      console.log(`${wardName}: ${elements.length} elements, ${streets.length} streets`);

      for (const el of elements) {
        const tags = el.tags || {};
        const houseNumber = tags['addr:housenumber'] || '';
        const street      = tags['addr:street'] || '';
        const postcode    = tags['addr:postcode'] || '';
        if (!street || !houseNumber) continue;

        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (!lat || !lon) continue;
        if (!pointInPolygon(lat, lon, ring)) continue;

        const key = `${houseNumber.toLowerCase()}|${street.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        wardAddresses.push({ houseNumber, street, postcode, lat, lon });
      }

      // Fallback: street centroids if very sparse OSM data
      if (wardAddresses.length < 20 && streets.length > 0) {
        const uniqueStreets = [...new Set(streets.map(w => w.tags?.name).filter(Boolean))];
        for (const streetName of uniqueStreets) {
          const way = streets.find(w => w.tags?.name === streetName);
          const center = way?.center;
          if (!center) continue;
          const key = `STREET|${streetName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          wardAddresses.push({ houseNumber: '', street: streetName, postcode: way?.tags?.['addr:postcode'] || '', lat: center.lat, lon: center.lon });
        }
      }

      console.log(`${wardName}: ${wardAddresses.length} unique addresses`);
      if (wardAddresses.length === 0) continue;

      // Cluster independently per ward so no zone spans a ward boundary
      const wardZones = clusterIntoZones(wardAddresses, max_doors);
      for (const zoneAddresses of wardZones) {
        allZoneGroups.push({ addresses: zoneAddresses, wardName });
      }
    }

    const totalAddresses = allZoneGroups.reduce((s, g) => s + g.addresses.length, 0);
    console.log(`${allZoneGroups.length} zones, ${totalAddresses} total addresses`);

    if (allZoneGroups.length === 0) {
      return Response.json({
        error: 'No addresses found in any ward. The area may lack OpenStreetMap address data.',
      }, { status: 422 });
    }

    // ── 3. Clear existing L-zones (turf only, no contacts to worry about) ─────
    if (clear_existing) {
      const existing = await base44.asServiceRole.entities.Turf.filter({ campaign_id });
      const toDelete = existing.filter(t => /^L\d+$/.test(t.name));
      console.log(`Deleting ${toDelete.length} existing L-zones…`);
      for (const t of toDelete) {
        await base44.asServiceRole.entities.Turf.delete(t.id);
      }
    }

    // ── 4. Create Turf records (addresses stored as JSON in notes) ────────────
    // We deliberately do NOT create Contact records here — it causes rate limits
    // and is unnecessary since the addresses are embedded in the Turf.
    // The addresses JSON can be used by a print/export function when needed.
    const created = [];

    for (let i = 0; i < allZoneGroups.length; i++) {
      const { addresses: zoneAddresses, wardName } = allZoneGroups[i];
      const zoneName = `L${i + 1}`;
      console.log(`Creating ${zoneName} (${zoneAddresses.length} addresses) in ${wardName}…`);

      const ordered = sortAddressesForWalking(zoneAddresses);
      const hullRing = convexHullRing(zoneAddresses);
      const centLat  = zoneAddresses.reduce((s, a) => s + a.lat, 0) / zoneAddresses.length;
      const centLon  = zoneAddresses.reduce((s, a) => s + a.lon, 0) / zoneAddresses.length;

      const geojson = JSON.stringify({
        type: 'Feature',
        properties: { name: zoneName, ward: wardName, address_count: ordered.length },
        geometry: { type: 'Polygon', coordinates: [hullRing] },
      });

      // Store the sorted address list as compact JSON in notes
      const addressListJson = JSON.stringify(ordered.map(a => ({
        n: a.houseNumber,
        s: a.street,
        p: a.postcode,
        lat: +a.lat.toFixed(6),
        lon: +a.lon.toFixed(6),
      })));

      const turf = await base44.asServiceRole.entities.Turf.create({
        campaign_id,
        name: zoneName,
        geojson,
        color: ZONE_COLORS[i % ZONE_COLORS.length],
        status: 'unassigned',
        priority: 'normal',
        target_doors: ordered.length,
        doors_knocked: 0,
        contact_count: ordered.length,
        goal: `Leaflet drop — ${ordered.length} addresses`,
        notes: addressListJson,
      });

      created.push({
        zone: zoneName,
        turf_id: turf.id,
        ward: wardName,
        address_count: ordered.length,
        centroid: [+centLat.toFixed(5), +centLon.toFixed(5)],
      });

      // Small pause between turf creates to be kind to the API
      if (i < allZoneGroups.length - 1) await new Promise(r => setTimeout(r, 200));
    }

    return Response.json({
      success: true,
      zones_created: created.length,
      total_addresses: totalAddresses,
      zones: created,
      message: `Created ${created.length} leaflet zones (L1–L${created.length}) covering ${totalAddresses} addresses across ${WARD_NAMES.join(' & ')}.`,
    });

  } catch (error) {
    console.error('generateLeafletZones error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});