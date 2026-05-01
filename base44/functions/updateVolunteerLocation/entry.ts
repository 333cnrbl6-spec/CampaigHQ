import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { latitude, longitude, postcode, turf_id, turf_name, current_contact_id, doors_knocked_today, battery_level } = body;

    if (!latitude || !longitude) {
      return Response.json({ error: 'Latitude and longitude required' }, { status: 400 });
    }

    // Find existing location record for this volunteer
    const existing = await base44.entities.VolunteerLocation.filter({
      volunteer_email: user.email,
    });

    const locationData = {
      volunteer_email: user.email,
      volunteer_name: user.full_name,
      latitude,
      longitude,
      postcode: postcode || null,
      turf_id: turf_id || null,
      turf_name: turf_name || null,
      current_contact_id: current_contact_id || null,
      doors_knocked_today: doors_knocked_today || 0,
      last_updated: new Date().toISOString(),
      status: 'active',
      battery_level: battery_level || null,
    };

    let result;
    if (existing.length > 0) {
      // Update existing
      result = await base44.entities.VolunteerLocation.update(existing[0].id, locationData);
    } else {
      // Create new
      result = await base44.entities.VolunteerLocation.create(locationData);
    }

    return Response.json({ success: true, location_id: result.id });
  } catch (error) {
    console.error('Error updating volunteer location:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});