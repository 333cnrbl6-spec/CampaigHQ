import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Haversine distance calculation (km)
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

// Extract house number for street-level sorting (odd vs even side)
function extractHouseNumber(address) {
  if (!address) return 9999;
  const match = address.match(/^(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 9999;
}

// Nearest-neighbour TSP for postcode sequence optimization
function nearestNeighbourTSP(postcodeGroups) {
  if (postcodeGroups.length <= 1) return postcodeGroups;
  
  const unvisited = [...postcodeGroups];
  const route = [unvisited.shift()];
  
  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;
    
    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversine(
        current.centroid.lat,
        current.centroid.lon,
        unvisited[i].centroid.lat,
        unvisited[i].centroid.lon
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    
    route.push(unvisited.splice(nearestIdx, 1)[0]);
  }
  
  return route;
}

// Calculate centroid of a group of coordinates
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
    const { contact_ids, turf_id, max_contacts_per_route } = body;

    // Fetch contacts to optimize
    let contacts = [];
    if (contact_ids && contact_ids.length > 0) {
      // Get specific contacts
      const allContacts = await base44.entities.Contact.list('name', 5000);
      contacts = allContacts.filter(c => contact_ids.includes(c.id));
    } else if (turf_id) {
      // Get all contacts in a turf
      const allContacts = await base44.entities.Contact.list('name', 5000);
      contacts = allContacts.filter(c => 
        c.tags && c.tags.includes(turf_id)
      );
    } else {
      return Response.json({ error: 'Provide either contact_ids or turf_id' }, { status: 400 });
    }

    if (contacts.length === 0) {
      return Response.json({ 
        success: true,
        message: 'No contacts to optimize',
        routes: []
      });
    }

    // Filter contacts with location data
    const withLocation = contacts.filter(c => c.latitude && c.longitude);
    const withoutLocation = contacts.filter(c => !c.latitude || !c.longitude);

    console.log(`Optimizing ${withLocation.length} located contacts, ${withoutLocation.length} without location`);

    // Group by postcode
    const postcodeGroups = {};
    withLocation.forEach(contact => {
      const pc = (contact.postcode || 'UNKNOWN').toUpperCase();
      if (!postcodeGroups[pc]) {
        postcodeGroups[pc] = {
          postcode: pc,
          centroid: { lat: contact.latitude, lon: contact.longitude },
          coords: [],
          contacts: [],
          distances: {},
        };
      }
      postcodeGroups[pc].coords.push({ lat: contact.latitude, lon: contact.longitude });
      postcodeGroups[pc].contacts.push(contact);
    });

    // Recalculate centroids for groups with multiple contacts
    Object.values(postcodeGroups).forEach(group => {
      if (group.contacts.length > 1) {
        group.centroid = calculateCentroid(group.coords);
      }
    });

    // TSP optimization over postcodes
    const sortedPostcodes = nearestNeighbourTSP(Object.values(postcodeGroups));

    // Build optimized routes
    const routes = [];
    let currentRoute = [];
    let currentDistance = 0;

    sortedPostcodes.forEach((postcodeGroup, idx) => {
      // Sort contacts within postcode by house number (natural street walking order)
      const sortedContacts = postcodeGroup.contacts.sort((a, b) =>
        extractHouseNumber(a.address) - extractHouseNumber(b.address)
      );

      // Calculate distance from last contact to this postcode
      let segmentDistance = 0;
      if (currentRoute.length > 0) {
        const lastContact = currentRoute[currentRoute.length - 1];
        segmentDistance = haversine(
          lastContact.latitude,
          lastContact.longitude,
          postcodeGroup.centroid.lat,
          postcodeGroup.centroid.lon
        );
      }

      // Check if we should start a new route
      const routeFull = max_contacts_per_route && 
                        currentRoute.length + sortedContacts.length > max_contacts_per_route;
      const distanceTooFar = currentRoute.length > 0 && segmentDistance > 2; // >2km between postcodes

      if (routeFull || distanceTooFar) {
        if (currentRoute.length > 0) {
          routes.push({
            stop_count: currentRoute.length,
            distance_km: currentDistance.toFixed(2),
            contacts: currentRoute,
          });
          currentRoute = [];
          currentDistance = 0;
        }
      }

      // Add contacts to current route
      sortedContacts.forEach((contact, contactIdx) => {
        currentRoute.push(contact);
        
        // Calculate distance to next contact
        if (contactIdx < sortedContacts.length - 1) {
          const nextContact = sortedContacts[contactIdx + 1];
          const dist = haversine(
            contact.latitude,
            contact.longitude,
            nextContact.latitude,
            nextContact.longitude
          );
          currentDistance += dist;
        } else if (idx < sortedPostcodes.length - 1) {
          // Distance to next postcode
          const nextPostcode = sortedPostcodes[idx + 1];
          const dist = haversine(
            contact.latitude,
            contact.longitude,
            nextPostcode.centroid.lat,
            nextPostcode.centroid.lon
          );
          currentDistance += dist;
        }
      });
    });

    // Add final route
    if (currentRoute.length > 0) {
      routes.push({
        stop_count: currentRoute.length,
        distance_km: currentDistance.toFixed(2),
        contacts: currentRoute,
      });
    }

    // Calculate stats
    const totalDistance = routes.reduce((sum, r) => sum + parseFloat(r.distance_km), 0);
    const avgDoorsPerRoute = Math.round(withLocation.length / routes.length);

    return Response.json({
      success: true,
      message: `Optimized ${contacts.length} contacts into ${routes.length} efficient routes`,
      stats: {
        total_contacts: contacts.length,
        contacts_with_location: withLocation.length,
        contacts_without_location: withoutLocation.length,
        total_routes: routes.length,
        total_distance_km: totalDistance.toFixed(2),
        avg_doors_per_route: avgDoorsPerRoute,
        avg_distance_per_route: (totalDistance / routes.length).toFixed(2),
      },
      routes,
      unlocated_contacts: withoutLocation.map(c => ({ id: c.id, name: c.name })),
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});