import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Haversine distance (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract house number for street ordering
function extractHouseNumber(address) {
  if (!address) return 9999;
  const match = address.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 9999;
}

// Nearest-neighbour TSP over postcodes
function nearestNeighbourTSP(groups) {
  if (groups.length <= 1) return groups;
  const unvisited = [...groups];
  const route = [unvisited.shift()];
  while (unvisited.length > 0) {
    const curr = route[route.length - 1];
    let best = 0, minDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversine(curr.centroid.lat, curr.centroid.lon, unvisited[i].centroid.lat, unvisited[i].centroid.lon);
      if (dist < minDist) { minDist = dist; best = i; }
    }
    route.push(unvisited.splice(best, 1)[0]);
  }
  return route;
}

// Calculate centroid of coordinates
function calculateCentroid(coords) {
  const count = coords.length;
  const lat = coords.reduce((sum, c) => sum + c.lat, 0) / count;
  const lon = coords.reduce((sum, c) => sum + c.lon, 0) / count;
  return { lat, lon };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      contact_ids = [], 
      turf_id = null,
      target_date = null,
      contacts_per_batch = 25, // ~2-3 hours of canvassing per volunteer
      strategy = 'balanced' // 'balanced', 'distance', or 'geospatial'
    } = body;

    // Fetch contacts
    let contacts = [];
    const allContacts = await base44.entities.Contact.list('name', 5000);
    
    if (contact_ids.length > 0) {
      contacts = allContacts.filter(c => contact_ids.includes(c.id));
    } else if (turf_id) {
      contacts = allContacts.filter(c => 
        c.tags && c.tags.includes(turf_id)
      );
    } else {
      return Response.json({ error: 'Provide contact_ids or turf_id' }, { status: 400 });
    }

    if (contacts.length === 0) {
      return Response.json({ 
        success: true,
        batches: [],
        stats: { total_contacts: 0, total_batches: 0 }
      });
    }

    // Separate located and unlocated
    const located = contacts.filter(c => c.latitude && c.longitude);
    const unlocated = contacts.filter(c => !c.latitude || !c.longitude);

    if (located.length === 0) {
      return Response.json({
        success: false,
        error: 'No contacts with geocoded locations. Run geocoding first.',
        unlocated_count: unlocated.length
      });
    }

    let batches = [];

    if (strategy === 'geospatial') {
      // Group by postcode, optimize postcode order, then chunk
      const postcodeGroups = {};
      located.forEach(c => {
        const pc = (c.postcode || 'UNKNOWN').toUpperCase();
        if (!postcodeGroups[pc]) {
          postcodeGroups[pc] = {
            postcode: pc,
            centroid: { lat: c.latitude, lon: c.longitude },
            coords: [],
            contacts: []
          };
        }
        postcodeGroups[pc].coords.push({ lat: c.latitude, lon: c.longitude });
        postcodeGroups[pc].contacts.push(c);
      });

      // Recalculate centroids
      Object.values(postcodeGroups).forEach(g => {
        if (g.contacts.length > 1) {
          g.centroid = calculateCentroid(g.coords);
        }
      });

      // TSP order postcodes
      const orderedPostcodes = nearestNeighbourTSP(Object.values(postcodeGroups));

      // Flatten in order, sort by house number within postcode
      const flatContacts = [];
      orderedPostcodes.forEach(pg => {
        const sorted = [...pg.contacts].sort((a, b) =>
          extractHouseNumber(a.address) - extractHouseNumber(b.address)
        );
        flatContacts.push(...sorted);
      });

      // Chunk into batches
      for (let i = 0; i < flatContacts.length; i += contacts_per_batch) {
        batches.push(flatContacts.slice(i, i + contacts_per_batch));
      }
    } else if (strategy === 'distance') {
      // Simple: sort by distance from origin, chunk
      const origin = { lat: located[0].latitude, lon: located[0].longitude };
      const sorted = [...located].sort((a, b) => {
        const dA = haversine(origin.lat, origin.lon, a.latitude, a.longitude);
        const dB = haversine(origin.lat, origin.lon, b.latitude, b.longitude);
        return dA - dB;
      });
      for (let i = 0; i < sorted.length; i += contacts_per_batch) {
        batches.push(sorted.slice(i, i + contacts_per_batch));
      }
    } else {
      // 'balanced': simple chunking (assumes contacts are roughly spatially grouped)
      for (let i = 0; i < located.length; i += contacts_per_batch) {
        batches.push(located.slice(i, i + contacts_per_batch));
      }
    }

    // Calculate batch stats
    const batchRecords = batches.map((batch, idx) => {
      const coords = batch.filter(c => c.latitude && c.longitude).map(c => ({ lat: c.latitude, lon: c.longitude }));
      const centroid = coords.length > 0 ? calculateCentroid(coords) : null;
      
      let distance = 0;
      if (coords.length > 1) {
        for (let i = 1; i < coords.length; i++) {
          distance += haversine(coords[i-1].lat, coords[i-1].lon, coords[i].lat, coords[i].lon);
        }
      }

      return {
        batch_number: idx + 1,
        date: target_date || new Date().toISOString().split('T')[0],
        contact_ids: batch.map(c => c.id),
        contact_count: batch.length,
        estimated_time_hours: Math.round((batch.length / 15) * 10) / 10, // ~15 contacts/hour
        distance_km: distance.toFixed(1),
        centroid,
        sample_contacts: batch.slice(0, 3).map(c => ({ id: c.id, name: c.name, address: c.address }))
      };
    });

    return Response.json({
      success: true,
      message: `Generated ${batches.length} route batches for ${located.length} contacts`,
      batches: batchRecords,
      stats: {
        total_contacts: contacts.length,
        located_contacts: located.length,
        unlocated_contacts: unlocated.length,
        total_batches: batches.length,
        avg_contacts_per_batch: Math.round(located.length / batches.length),
        strategy,
      }
    });
  } catch (error) {
    console.error('Error generating batches:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});