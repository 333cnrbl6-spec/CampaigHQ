import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const WARD_MAPIT_IDS = [167462, 167449]; // Tyldesley & Mosley Common + Abram
const WARD_NAMES    = ['Tyldesley & Mosley Common', 'Abram'];
const MAX_DOORS_PER_ZONE = 200;
// Primary + fallback Overpass endpoints
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// ─── MapIt ────────────────────────────────────────────────────────────────────

async function fetchWardPolygon(mapit_id) {
  const res = await fetch(`https://mapit.mysociety.org/area/${mapit_id}.geojson`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`MapIt ${res.status} for area ${mapit_id}`);
  return res.json();
}

async function fetchAllWardData() {
  const results = [];
  for (let i = 0; i < WARD_MAPIT_IDS.length; i++) {
    try {
      const geom = await fetchWardPolygon(WARD_MAPIT_IDS[i]);
      results.push({ geom, name: WARD_NAMES[i] });
    } catch (e) {
      console.warn(`Ward ${WARD_MAPIT_IDS[i]} failed:`, e.message);
    }
  }
  return results;
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
  return ring.map(([lon, lat]) => `${lat} ${lon}`).join(' ');
}

async function overpassPost(query, retries = 6) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const url = OVERPASS_ENDPOINTS[(attempt - 1) % OVERPASS_ENDPOINTS.length];
    try {
      const res = await fetch(url, {
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
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const wait = Math.min(attempt * 4000, 15000);
        console.warn(`Overpass ${res.status} via ${url} (attempt ${attempt}), retrying in ${wait}ms…`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      const txt = await res.text();
      console.error('Overpass error:', txt.slice(0, 400));
      throw new Error(`Overpass ${res.status}`);
    } catch (err) {
      if (attempt < retries) {
        const wait = Math.min(attempt * 4000, 15000);
        console.warn(`Overpass fetch error (attempt ${attempt}): ${err.message}, retrying in ${wait}ms via fallback…`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

async function fetchAddressesInWard(ring) {
  const polyStr = buildPolyString(ring);
  const query = `[out:json][timeout:90];(
    node["addr:housenumber"](poly:"${polyStr}");
    way["addr:housenumber"](poly:"${polyStr}");
    node["addr:housename"](poly:"${polyStr}");
    way["addr:interpolation"](poly:"${polyStr}");
    relation["type"="associatedStreet"](poly:"${polyStr}");
  );out center tags;`;
  console.log('Querying Overpass for addresses (POST)…');
  return overpassPost(query);
}

async function fetchStreetsInWard(ring) {
  const polyStr = buildPolyString(ring);
  const query = `[out:json][timeout:60];(
    way["highway"~"residential|tertiary|secondary|primary|unclassified|living_street"]["name"](poly:"${polyStr}");
  );out tags center;`;
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

// Clip a rectangle [minLon,minLat,maxLon,maxLat] against a ward ring using Sutherland-Hodgman
function clipRectToWard(minLon, minLat, maxLon, maxLat, wardRing) {
  // Build polygon as [lon,lat] pairs
  let poly = [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
  ];

  // Clip against each edge of the ward ring
  const n = wardRing.length - 1; // last point == first point
  for (let e = 0; e < n; e++) {
    if (poly.length === 0) return null;
    const [x1, y1] = wardRing[e];
    const [x2, y2] = wardRing[e + 1];
    const output = [];
    for (let i = 0; i < poly.length; i++) {
      const cur  = poly[i];
      const prev = poly[(i - 1 + poly.length) % poly.length];
      const curIn  = isInsideEdge(cur,  x1, y1, x2, y2);
      const prevIn = isInsideEdge(prev, x1, y1, x2, y2);
      if (curIn) {
        if (!prevIn) output.push(intersect(prev, cur, x1, y1, x2, y2));
        output.push(cur);
      } else if (prevIn) {
        output.push(intersect(prev, cur, x1, y1, x2, y2));
      }
    }
    poly = output;
  }

  if (poly.length < 3) return null;
  // Close the ring
  poly.push(poly[0]);
  return poly; // [[lon,lat],...]
}

function isInsideEdge([px, py], x1, y1, x2, y2) {
  return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1) >= 0;
}

function intersect([ax, ay], [bx, by], x1, y1, x2, y2) {
  const dx1 = bx - ax, dy1 = by - ay;
  const dx2 = x2 - x1, dy2 = y2 - y1;
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return [ax, ay];
  const t = ((x1 - ax) * dy2 - (y1 - ay) * dx2) / denom;
  return [ax + t * dx1, ay + t * dy1];
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

  // Sort cells north-to-south, west-to-east (snake pattern for walking continuity)
  const cells = Object.values(cellMap).sort((a, b) =>
    b.row !== a.row ? b.row - a.row : a.col - b.col
  );

  const zones = [];
  let current = [];
  for (const cell of cells) {
    const cellAddrs = cell.addresses;
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

  // Merge tiny zones (< 10 addresses) into neighbours
  const MIN_ZONE = 10;
  const merged = [];
  for (let z = 0; z < zones.length; z++) {
    if (zones[z].length < MIN_ZONE) {
      if (merged.length > 0 && merged.at(-1).length + zones[z].length <= maxDoorsPerZone) {
        merged.at(-1).push(...zones[z]);
      } else if (z + 1 < zones.length && zones[z + 1].length + zones[z].length <= maxDoorsPerZone) {
        zones[z + 1] = [...zones[z], ...zones[z + 1]];
      } else {
        merged.push(zones[z]);
      }
    } else {
      merged.push(zones[z]);
    }
  }
  return merged;
}

// ─── Zone polygon: grid cell clipped to ward boundary ─────────────────────────
// Instead of convex hull (leaves gaps), we compute the bounding grid cell used
// in clustering and clip it to the ward polygon. This tiles the full ward surface.

function zonePolygonFromAddresses(addresses, wardRing, allAddresses, gridDim, minLat, latStep, minLon, lonStep) {
  if (addresses.length === 0) return null;

  // Find the grid cell(s) occupied by this zone's addresses
  const rows = new Set(), cols = new Set();
  for (const a of addresses) {
    const row = Math.min(Math.floor((a.lat - minLat) / latStep), gridDim - 1);
    const col = Math.min(Math.floor((a.lon - minLon) / lonStep), gridDim - 1);
    rows.add(row);
    cols.add(col);
  }

  // Bounding box of the occupied grid cells
  const minRow = Math.min(...rows), maxRow = Math.max(...rows);
  const minCol = Math.min(...cols), maxCol = Math.max(...cols);

  const boxMinLat = minLat + minRow * latStep;
  const boxMaxLat = minLat + (maxRow + 1) * latStep;
  const boxMinLon = minLon + minCol * lonStep;
  const boxMaxLon = minLon + (maxCol + 1) * lonStep;

  // Clip the bounding box to the ward boundary
  const clipped = clipRectToWard(boxMinLon, boxMinLat, boxMaxLon, boxMaxLat, wardRing);
  if (!clipped || clipped.length < 4) {
    // Fall back to bounding box if clipping fails
    return [[boxMinLon, boxMinLat],[boxMaxLon, boxMinLat],[boxMaxLon, boxMaxLat],[boxMinLon, boxMaxLat],[boxMinLon, boxMinLat]];
  }
  return clipped;
}

// Sort by street name then house number for logical walking order
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
    const wardData = await fetchAllWardData();
    if (wardData.length === 0) throw new Error('Could not fetch any ward boundaries from MapIt');
    console.log(`${wardData.length} ward boundaries fetched`);

    // ── 2. Per-ward address fetch + clustering ────────────────────────────────
    const allZoneGroups = []; // [{addresses[], wardName, wardRing, gridInfo}]

    for (const { geom, name: wardName } of wardData) {
      const ring = getOuterRing(geom);
      const seen = new Set();
      const wardAddresses = [];

      const [elements, streets] = await Promise.all([
        fetchAddressesInWard(ring),
        fetchStreetsInWard(ring),
      ]);
      console.log(`${wardName}: ${elements.length} elements, ${streets.length} streets`);

      // Expand addr:interpolation ways
      const interpolationWays = elements.filter(el => el.type === 'way' && el.tags?.['addr:interpolation']);
      for (const way of interpolationWays) {
        const interp = way.tags['addr:interpolation'];
        const fromNum = parseInt(way.tags['addr:housenumber:from'] || way.tags['addr:interpolation:from'] || way.tags['addr:from']);
        const toNum   = parseInt(way.tags['addr:housenumber:to']   || way.tags['addr:interpolation:to']   || way.tags['addr:to']);
        const street  = way.tags['addr:street'] || '';
        const postcode= way.tags['addr:postcode'] || '';
        if (!street || isNaN(fromNum) || isNaN(toNum)) continue;
        const step = (interp === 'even' || interp === 'odd') ? 2 : 1;
        const center = way.center;
        if (!center) continue;
        for (let n = fromNum; n <= toNum; n += step) {
          const key = `${n}|${street.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            wardAddresses.push({ houseNumber: String(n), street, postcode, lat: center.lat, lon: center.lon });
          }
        }
      }

      for (const el of elements) {
        const tags = el.tags || {};
        if (el.type === 'way' && tags['addr:interpolation']) continue;

        const houseNumber = tags['addr:housenumber'] || tags['addr:housename'] || '';
        const street      = tags['addr:street'] || '';
        const postcode    = tags['addr:postcode'] || '';

        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (!lat || !lon || !houseNumber) continue;
        if (!pointInPolygon(lat, lon, ring)) continue;

        const key = `${houseNumber.toLowerCase()}|${street.toLowerCase()}|${lat.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        wardAddresses.push({ houseNumber, street, postcode, lat, lon });
      }

      // Fallback: street centroids if very sparse data
      if (wardAddresses.length < 50 && streets.length > 0) {
        console.log(`${wardName}: sparse data (${wardAddresses.length}), using street fallback…`);
        const uniqueStreets = [...new Set(streets.map(w => w.tags?.name).filter(Boolean))];
        for (const streetName of uniqueStreets) {
          const way = streets.find(w => w.tags?.name === streetName);
          const center = way?.center;
          if (!center) continue;
          for (let n = 1; n <= 10; n += 2) {
            const key = `STREET_EST|${n}|${streetName}`;
            if (seen.has(key)) continue;
            seen.add(key);
            wardAddresses.push({ houseNumber: String(n), street: streetName, postcode: '', lat: center.lat + (n - 5) * 0.00003, lon: center.lon });
          }
        }
      }

      console.log(`${wardName}: ${wardAddresses.length} unique addresses`);
      if (wardAddresses.length === 0) continue;

      // Compute grid dimensions (same logic as clusterIntoZones) so polygon generation matches
      let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
      for (const a of wardAddresses) {
        if (a.lat < minLat) minLat = a.lat;
        if (a.lat > maxLat) maxLat = a.lat;
        if (a.lon < minLon) minLon = a.lon;
        if (a.lon > maxLon) maxLon = a.lon;
      }
      const cellTarget = Math.max(10, Math.floor(max_doors / 4));
      const gridDim = Math.max(1, Math.ceil(Math.sqrt(wardAddresses.length / cellTarget)));
      const latStep = (maxLat - minLat) / gridDim || 0.001;
      const lonStep = (maxLon - minLon) / gridDim || 0.001;

      const wardZones = clusterIntoZones(wardAddresses, max_doors);
      for (const zoneAddresses of wardZones) {
        allZoneGroups.push({ addresses: zoneAddresses, wardName, wardRing: ring, wardAllAddresses: wardAddresses, gridDim, minLat, latStep, minLon, lonStep });
      }
    }

    const totalAddresses = allZoneGroups.reduce((s, g) => s + g.addresses.length, 0);
    console.log(`${allZoneGroups.length} zones, ${totalAddresses} total addresses`);

    if (allZoneGroups.length === 0) {
      return Response.json({ error: 'No addresses found in any ward.' }, { status: 422 });
    }

    // ── 3. Clear existing L-zones ─────────────────────────────────────────────
    if (clear_existing) {
      const existing = await base44.asServiceRole.entities.Turf.filter({ campaign_id });
      const toDelete = existing.filter(t => /^L\d+$/.test(t.name));
      console.log(`Deleting ${toDelete.length} existing L-zones…`);
      for (const t of toDelete) {
        await base44.asServiceRole.entities.Turf.delete(t.id);
      }
    }

    // ── 4. Create Turf records ────────────────────────────────────────────────
    const created = [];

    for (let i = 0; i < allZoneGroups.length; i++) {
      const { addresses: zoneAddresses, wardName, wardRing, wardAllAddresses, gridDim, minLat, latStep, minLon, lonStep } = allZoneGroups[i];
      const zoneName = `L${i + 1}`;
      console.log(`Creating ${zoneName} (${zoneAddresses.length} addresses) in ${wardName}…`);

      const ordered = sortAddressesForWalking(zoneAddresses);

      // Use ward-boundary-clipped grid cell polygon (fills full ward surface, no gaps)
      const polygonRing = zonePolygonFromAddresses(zoneAddresses, wardRing, wardAllAddresses, gridDim, minLat, latStep, minLon, lonStep);

      const centLat = zoneAddresses.reduce((s, a) => s + a.lat, 0) / zoneAddresses.length;
      const centLon = zoneAddresses.reduce((s, a) => s + a.lon, 0) / zoneAddresses.length;

      const geojson = JSON.stringify({
        type: 'Feature',
        properties: { name: zoneName, ward: wardName, address_count: ordered.length },
        geometry: { type: 'Polygon', coordinates: [polygonRing] },
      });

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