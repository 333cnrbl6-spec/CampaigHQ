import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Query Overpass API for all address nodes and street names within a polygon
async function fetchAddressesInPolygon(coordinates) {
  // Build poly string for Overpass: "lat lon lat lon ..."
  const polyStr = coordinates.map(([lon, lat]) => `${lat} ${lon}`).join(' ');

  const query = `[out:json][timeout:30];(node["addr:housenumber"]["addr:street"](poly:"${polyStr}"););out body;`;

  console.log('Querying Overpass API for addresses in polygon...');
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CampaignApp/1.0 (political canvassing tool)',
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Overpass error body:', text.slice(0, 500));
    throw new Error(`Overpass API error: ${res.status}`);
  }

  const data = await res.json();
  return data.elements || [];
}

// Also fetch street names within the polygon (for streets without individual house nodes)
async function fetchStreetsInPolygon(coordinates) {
  const polyStr = coordinates.map(([lon, lat]) => `${lat} ${lon}`).join(' ');

  const query = `[out:json][timeout:30];(way["highway"]["name"](poly:"${polyStr}"););out tags center;`;

  const url2 = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
  const res = await fetch(url2, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CampaignApp/1.0 (political canvassing tool)',
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.elements || [];
}

// Geocode a UK address string via postcodes.io (for postcode centroids)
async function geocodeAddress(houseNumber, street, postcode) {
  if (postcode) {
    try {
      const pc = postcode.replace(/\s+/g, '').toUpperCase();
      const res = await fetch(`https://api.postcodes.io/postcodes/${pc}`);
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          return { latitude: data.result.latitude, longitude: data.result.longitude, postcode: data.result.postcode };
        }
      }
    } catch {}
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { geojson, turf_id, campaign_id, turf_name } = body;

    if (!geojson || !campaign_id) {
      return Response.json({ error: 'geojson and campaign_id required' }, { status: 400 });
    }

    const geo = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Extract polygon coordinates from GeoJSON
    let coordinates = null;
    if (geo.type === 'Feature' && geo.geometry?.type === 'Polygon') {
      coordinates = geo.geometry.coordinates[0];
    } else if (geo.type === 'Polygon') {
      coordinates = geo.coordinates[0];
    } else if (geo.type === 'Feature' && geo.geometry?.type === 'MultiPolygon') {
      coordinates = geo.geometry.coordinates[0][0];
    }

    if (!coordinates || coordinates.length < 3) {
      return Response.json({ error: 'Invalid polygon geometry' }, { status: 400 });
    }

    console.log(`Fetching addresses in polygon for turf: ${turf_name}`);

    // Fetch addresses and streets from OpenStreetMap
    const [addressNodes, streetWays] = await Promise.all([
      fetchAddressesInPolygon(coordinates),
      fetchStreetsInPolygon(coordinates),
    ]);

    console.log(`Found ${addressNodes.length} address nodes, ${streetWays.length} street ways`);

    // Build contact records from address nodes
    const contactsToCreate = [];
    const seenAddresses = new Set();

    for (const node of addressNodes) {
      const tags = node.tags || {};
      const houseNumber = tags['addr:housenumber'] || '';
      const street = tags['addr:street'] || '';
      const postcode = tags['addr:postcode'] || '';
      const city = tags['addr:city'] || tags['addr:town'] || '';

      if (!street) continue;

      const addressLine = houseNumber ? `${houseNumber} ${street}` : street;
      const fullAddress = `${addressLine}${postcode ? ', ' + postcode : ''}`;

      if (seenAddresses.has(fullAddress)) continue;
      seenAddresses.add(fullAddress);

      contactsToCreate.push({
        campaign_id,
        name: addressLine,
        address: addressLine,
        postcode: postcode || '',
        latitude: node.lat || null,
        longitude: node.lon || null,
        tags: [turf_name || 'auto-imported'],
        support_level: 'unknown',
        canvassed: false,
        registered_voter: false,
        consent_given: false,
        consent_method: 'unknown',
        notes: `Auto-imported from map polygon. Street: ${street}`,
      });
    }

    // If very few address nodes found, add street-level entries from highway ways
    if (contactsToCreate.length < 5 && streetWays.length > 0) {
      const uniqueStreets = [...new Set(streetWays.map(w => w.tags?.name).filter(Boolean))];
      console.log(`Adding ${uniqueStreets.length} street-level entries as fallback`);

      for (const streetName of uniqueStreets) {
        const way = streetWays.find(w => w.tags?.name === streetName);
        const center = way?.center;
        const key = `STREET:${streetName}`;
        if (seenAddresses.has(key)) continue;
        seenAddresses.add(key);

        contactsToCreate.push({
          campaign_id,
          name: streetName,
          address: streetName,
          postcode: '',
          latitude: center?.lat || null,
          longitude: center?.lon || null,
          tags: [turf_name || 'auto-imported', 'street-only'],
          support_level: 'unknown',
          canvassed: false,
          registered_voter: false,
          consent_given: false,
          consent_method: 'unknown',
          notes: `Auto-imported street from map polygon.`,
        });
      }
    }

    if (contactsToCreate.length === 0) {
      return Response.json({
        success: true,
        message: 'No addresses found in this polygon area. Try a larger area or one with more OSM data.',
        created: 0,
      });
    }

    console.log(`Creating ${contactsToCreate.length} contact records...`);

    // Batch create in groups of 50
    let created = 0;
    const BATCH = 50;
    for (let i = 0; i < contactsToCreate.length; i += BATCH) {
      const batch = contactsToCreate.slice(i, i + BATCH);
      try {
        await base44.asServiceRole.entities.Contact.bulkCreate(batch);
        created += batch.length;
      } catch (err) {
        console.error(`Batch ${i}-${i + BATCH} failed:`, err.message);
      }
      if (i + BATCH < contactsToCreate.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Update turf contact count
    if (turf_id) {
      await base44.asServiceRole.entities.Turf.update(turf_id, {
        contact_count: created,
      });
    }

    return Response.json({
      success: true,
      message: `Successfully imported ${created} addresses from the drawn polygon.`,
      created,
      address_nodes_found: addressNodes.length,
      street_ways_found: streetWays.length,
    });

  } catch (error) {
    console.error('populateTurfContacts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});