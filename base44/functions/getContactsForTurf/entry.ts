import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id, turf_id } = body;

    if (!campaign_id || !turf_id) {
      return Response.json({ error: 'Missing campaign_id or turf_id' }, { status: 400 });
    }

    // Fetch turf
    const turf = await base44.asServiceRole.entities.Turf.get(turf_id);

    if (!turf || turf.campaign_id !== campaign_id) {
      return Response.json({ error: 'Turf not found' }, { status: 404 });
    }

    // Authorization: check if user has access to this turf
    const isOrganizer = user.role === 'organizer' || user.role === 'admin';
    const isAssigned = turf.assigned_to === user.email || 
                       (turf.assigned_team && turf.assigned_team.includes(user.email));

    if (!isOrganizer && !isAssigned) {
      return Response.json({ error: 'Access denied to this turf' }, { status: 403 });
    }

    // Fetch contacts for this turf
    const contacts = await base44.asServiceRole.entities.Contact.filter(
      { campaign_id, turf_id },
      'name'
    );

    return Response.json({ contacts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});