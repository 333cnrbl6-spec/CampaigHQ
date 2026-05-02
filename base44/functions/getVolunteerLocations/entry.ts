import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id, volunteer_email } = body;

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    // Determine what locations user can view
    let query = { campaign_id: campaign_id };

    if (user.role === 'organizer' || user.role === 'admin') {
      // Organizers see all volunteer locations
      if (volunteer_email) {
        query.volunteer_email = volunteer_email;
      }
    } else {
      // Volunteers see only their own location
      query.volunteer_email = user.email;
    }

    const locations = await base44.asServiceRole.entities.VolunteerLocation.filter(
      query,
      '-last_updated'
    );

    return Response.json({ locations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});