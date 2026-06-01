import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const WARD_MAPIT_IDS = [167462, 167449]; // Tyldesley & Mosley Common + Abram
const MAX_DOORS_PER_ZONE = 200;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Fetch a ward boundary polygon from MapIt
async function fetchWardPolygon(mapit_id) {
  const res = await fetch(`https://mapit.mysociety.org/area/${mapit_id}.geojson`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MapIt returned ${res.status} for area ${mapit_id}`);
  return await res.json();
}

// Fetch all ward polygons and return their outer rings
async function fetchAllWardRings() {
  const rings = [];
  for (const id of WARD_MAPIT_IDS) {
    try {
      const geom = await fetchWardPolygon(id);
      rings.push(getOuterRing(geom));
    } catch (e) {
      console.warn(`Failed to fetch ward ${id}:`, e.message);
    }
  }
  return rings;
}

// Extract the outer ring of coordinates from a Polygon or MultiPolygon geometry
function getOuterRing(geom) {
  if (geom.type === 'Polygon') return geom.coordinates[0];
  if (geom.type === 'MultiPolygon') {
    // Return the ring of the largest polygon
    let best = [];
    for (const poly of geom.coordinates) {
      if (poly[0].length > best.length) best = poly[0];
    }
    return best;
  }
  throw new Error('Unsupported geometry type: ' + geom.type);
}

// Build Overpass poly string from coordinate ring
function buildPolyString(ring) {
  // ring is [[lon, lat], ...] in GeoJSON order
  return ring.map(([lon, lat]) => `${lat} ${lon}`).join(' ');
}

// POST to Overpass (avoids URL length limit on large poly strings)
async function overpassPost(query) {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'CampaignApp/1.0 (political canvassing)',
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error('Overpass error:', txt.slice(0, 400));
    throw new Error(`Overpass returned ${res.status}`);
  }
  const data = await res.json();
  return data.elements || [];
}

// Query Overpass for all residential address nodes inside the ward polygon
async function fetchAddressesInWard(ring) {
  const polyStr = buildPolyString(ring);
  const query = `[out:json][timeout:60];(node["addr:housenumber"]["addr:street"](poly:"${polyStr}");way["addr:housenumber"]["addr:street"](poly:"${polyStr}"););out center tags;`;
  console.log('Querying Overpass for ward addresses (POST)...');
  return overpassPost(query);
}

// Also fetch street ways for zones that have no individual address nodes
async function fetchStreetsInWard(ring) {
  const polyStr = buildPolyString(ring);
  const query = `[out:json][timeout:30];(way["highway"~"residential|tertiary|secondary|primary|unclassified"]["name"](poly:"${polyStr}"););out tags center;`;
  try {
    return await overpassPost(query);
  } catch {
    return [];
  }
}

// Ray-casting point-in-polygon check
function pointInPolygon(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];  // [lon, lat] GeoJSON
    const [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Simple geographic clustering: divide the bounding box into a grid,
// assign each address to a cell, then merge cells into zones of ≤ MAX_DOORS_PER_ZONE.
function clusterIntoZones(addresses, maxDoorsPerZone) {
  if (addresses.length === 0) return [];

  // Compute bounding box
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const a of addresses) {
    if (a.lat < minLat) minLat = a.lat;
    if (a.lat > maxLat) maxLat = a.lat;
    if (a.lon < minLon) minLon = a.lon;
    if (a.lon > maxLon) maxLon = a.lon;
  }

  // Estimate grid size: aim for ~20 addresses per cell
  const total = addresses.length;
  const cellTarget = Math.max(10, Math.floor(maxDoorsPerZone / 4));
  const gridDim = Math.ceil(Math.sqrt(total / cellTarget));
  const latStep = (maxLat - minLat) / gridDim || 0.001;
  const lonStep = (maxLon - minLon) / gridDim || 0.001;

  // Assign cells
  const cellMap = {};
  for (const a of addresses) {
    const row = Math.min(Math.floor((a.lat - minLat) / latStep), gridDim - 1);
    const col = Math.min(Math.floor((a.lon - minLon) / lonStep), gridDim - 1);
    const key = `${row}_${col}`;
    if (!cellMap[key]) cellMap[key] = { row, col, addresses: [] };
    cellMap[key].addresses.push(a);
  }

  // Sort cells left-to-right, top-to-bottom (row descending = north first)
  const cells = Object.values(cellMap).sort((a, b) =>
    b.row !== a.row ? b.row - a.row : a.col - b.col
  );

  // Greedy merge into zones of ≤ maxDoorsPerZone
  // Split any cell that by itself exceeds the limit
  const zones = [];
  let current = [];
  for (const cell of cells) {
    const cellAddrs = cell.addresses;
    // If this cell alone exceeds the limit, split it into chunks first
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

  return zones;
}

// Build a convex hull GeoJSON polygon for a zone's addresses
function convexHull(points) {
  // points: [{lat, lon}, ...]
  if (points.length < 3) {
    // Fallback: bounding box
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const pad = 0.0005;
    const minLat = Math.min(...lats) - pad, maxLat = Math.max(...lats) + pad;
    const minLon = Math.min(...lons) - pad, maxLon = Math.max(...lons) + pad;
    return [[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]];
  }

  // Graham scan
  const sorted = [...points].sort((a, b) => a.lon !== b.lon ? a.lon - b.lon : a.lat - b.lat);
  const cross = (o, a, b) => (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon);

  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  lower.pop(); upper.pop();
  const hull = [...lower, ...upper];

  // Pad hull by ~50m
  const clat = hull.reduce((s, p) => s + p.lat, 0) / hull.length;
  const clon = hull.reduce((s, p) => s + p.lon, 0) / hull.length;
  const PAD = 0.0008;
  const padded = hull.map(p => ({
    lat: p.lat + (p.lat - clat) * PAD / (Math.abs(p.lat - clat) || 0.0001),
    lon: p.lon + (p.lon - clon) * PAD / (Math.abs(p.lon - clon) || 0.0001),
  }));

  const ring = padded.map(p => [p.lon, p.lat]);
  ring.push(ring[0]); // close
  return ring;
}

// Sort addresses by street then house number (fast, no AI needed)
function sortAddressesForWalking(addresses) {
  return [...addresses].sort((a, b) => {
    if (a.street < b.street) return -1;
    if (a.street > b.street) return 1;
    return (parseInt(a.houseNumber) || 0) - (parseInt(b.houseNumber) || 0);
  });
}

// COLOURS for zones
const ZONE_COLORS = [
  '#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#0ea5e9', '#84cc16',
  '#a855f7', '#14b8a6', '#f43f5e', '#6366f1', '#78716c',
  '#10b981', '#facc15', '#fb923c', '#c084fc', '#34d399',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { campaign_id, max_doors = MAX_DOORS_PER_ZONE, clear_existing = false } = body;

    if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

    console.log(`Generating leaflet zones for campaign ${campaign_id}, max ${max_doors} doors/zone`);

    // 1. Fetch all ward boundaries (each ward processed separately to respect boundaries)
    console.log('Fetching ward boundaries from MapIt...');
    const wardRings = await fetchAllWardRings();
    if (wardRings.length === 0) throw new Error('Could not fetch any ward boundaries');
    console.log(`Fetched ${wardRings.length} ward boundaries`);

    // 2. Fetch addresses per ward and cluster each ward independently
    console.log('Fetching addresses from Overpass API for each ward separately...');

    // Ward names for labelling
    const wardNames = ['Tyldesley & Mosley Common', 'Abram'];
    const allZoneGroups = []; // [{addresses, wardName}, ...]

    for (let wi = 0; wi < wardRings.length; wi++) {
      const outerRing = wardRings[wi];
      const wardName = wardNames[wi] || `Ward ${wi + 1}`;
      const seen = new Set();
      const wardAddresses = [];

      const [elements, streets] = await Promise.all([
        fetchAddressesInWard(outerRing),
        fetchStreetsInWard(outerRing),
      ]);
      console.log(`${wardName}: ${elements.length} address elements, ${streets.length} streets`);

      for (const el of elements) {
        const tags = el.tags || {};
        const houseNumber = tags['addr:housenumber'] || '';
        const street = tags['addr:street'] || '';
        const postcode = tags['addr:postcode'] || '';
        if (!street || !houseNumber) continue;

        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (!lat || !lon) continue;

        if (!pointInPolygon(lat, lon, outerRing)) continue;

        const key = `${houseNumber.toLowerCase()}_${street.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        wardAddresses.push({ houseNumber, street, postcode, lat, lon });
      }

      // Supplement with street centroids if very few address nodes
      if (wardAddresses.length < 20 && streets.length > 0) {
        const uniqueStreets = [...new Set(streets.map(w => w.tags?.name).filter(Boolean))];
        for (const streetName of uniqueStreets) {
          const way = streets.find(w => w.tags?.name === streetName);
          const center = way?.center;
          if (!center) continue;
          const key = `STREET_${streetName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          wardAddresses.push({ houseNumber: '', street: streetName, postcode: way?.tags?.['addr:postcode'] || '', lat: center.lat, lon: center.lon });
        }
      }

      console.log(`${wardName}: ${wardAddresses.length} unique addresses`);

      if (wardAddresses.length > 0) {
        // Cluster this ward's addresses into zones — each zone stays within the ward
        const wardZones = clusterIntoZones(wardAddresses, max_doors);
        for (const zoneAddresses of wardZones) {
          allZoneGroups.push({ addresses: zoneAddresses, wardName });
        }
      }
    }

    const totalAddresses = allZoneGroups.reduce((s, g) => s + g.addresses.length, 0);
    console.log(`${allZoneGroups.length} zones across all wards, ${totalAddresses} total addresses`);

    if (allZoneGroups.length === 0) {
      return Response.json({ error: 'No addresses found in any ward area. The area may not have enough OpenStreetMap data.' }, { status: 422 });
    }

    // 4. Clear existing L-zones if requested
    if (clear_existing) {
      const existing = await base44.asServiceRole.entities.Turf.filter({ campaign_id });
      const leafletZones = existing.filter(t => /^L\d+$/.test(t.name));
      console.log(`Clearing ${leafletZones.length} existing leaflet zones...`);
      for (const t of leafletZones) {
        await base44.asServiceRole.entities.Turf.delete(t.id);
      }
    }

    // 5. For each zone: sort walking order, build GeoJSON, create Turf + Contacts
    const created = [];
    for (let i = 0; i < allZoneGroups.length; i++) {
      const { addresses: zoneAddresses, wardName } = allZoneGroups[i];
      const zoneName = `L${i + 1}`;
      console.log(`Processing zone ${zoneName} (${zoneAddresses.length} addresses) in ${wardName}...`);

      // Sort by street then house number for natural walking order
      const ordered = sortAddressesForWalking(zoneAddresses);

      // Build convex hull GeoJSON polygon for the zone
      const hullRing = convexHull(zoneAddresses);
      const geojson = JSON.stringify({
        type: 'Feature',
        properties: { name: zoneName },
        geometry: { type: 'Polygon', coordinates: [hullRing] },
      });

      // Centroid for the zone
      const centLat = zoneAddresses.reduce((s, a) => s + a.lat, 0) / zoneAddresses.length;
      const centLon = zoneAddresses.reduce((s, a) => s + a.lon, 0) / zoneAddresses.length;

      // Create the Turf record
      const turf = await base44.asServiceRole.entities.Turf.create({
        campaign_id,
        name: zoneName,
        geojson,
        color: ZONE_COLORS[i % ZONE_COLORS.length],
        status: 'unassigned',
        priority: 'normal',
        target_doors: zoneAddresses.length,
        doors_knocked: 0,
        contact_count: ordered.length,
        goal: `Leaflet drop — ${ordered.length} addresses`,
        notes: `Leaflet zone within ${wardName} ward. ${ordered.length} addresses sorted by street walking order.`,
      });

      // Create Contact records for each address in the zone
      const contacts = ordered.map((a, idx) => ({
        campaign_id,
        name: a.houseNumber ? `${a.houseNumber} ${a.street}` : a.street,
        address: a.houseNumber ? `${a.houseNumber} ${a.street}` : a.street,
        postcode: a.postcode || '',
        latitude: a.lat,
        longitude: a.lon,
        tags: [zoneName, 'leaflet-zone', 'auto-generated'],
        support_level: 'unknown',
        canvassed: false,
        registered_voter: false,
        consent_given: false,
        consent_method: 'unknown',
        notes: `Leaflet zone ${zoneName} — stop ${idx + 1} of ${ordered.length}. Centre: ${centLat.toFixed(5)},${centLon.toFixed(5)}`,
      }));

      // Batch create in groups of 10 with delay + retry on 429
      for (let b = 0; b < contacts.length; b += 10) {
        const batch = contacts.slice(b, b + 10);
        let retries = 3;
        while (retries > 0) {
          try {
            await base44.asServiceRole.entities.Contact.bulkCreate(batch);
            break;
          } catch (err) {
            if (err.status === 429 && retries > 1) {
              retries--;
              await new Promise(r => setTimeout(r, 2000));
            } else {
              throw err;
            }
          }
        }
        await new Promise(r => setTimeout(r, 600));
      }

      created.push({
        zone: zoneName,
        turf_id: turf.id,
        address_count: ordered.length,
        centroid: [centLat, centLon],
      });
    }

    return Response.json({
      success: true,
      zones_created: created.length,
      total_addresses: totalAddresses,
      zones: created,
      message: `Successfully created ${created.length} leaflet zones (L1–L${created.length}) covering ${totalAddresses} addresses. Zones respect ward boundaries.`,
    });

  } catch (error) {
    console.error('generateLeafletZones error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});