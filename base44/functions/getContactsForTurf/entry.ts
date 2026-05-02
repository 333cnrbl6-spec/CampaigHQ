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

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    // If turf_id provided, fetch contacts for that turf; otherwise fetch all contacts for campaign
    let contacts;
    if (turf_id) {
      // Fetch turf to verify access
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

      contacts = await base44.asServiceRole.entities.Contact.filter(
        { campaign_id, turf_id },
        'name'
      );
    } else {
      // Fetch all contacts for campaign (organizers/admins only, or user's own contacts)
      const isOrganizer = user.role === 'organizer' || user.role === 'admin';
      if (!isOrganizer) {
        // Regular users can only see contacts for their assigned turfs
        const turfs = await base44.asServiceRole.entities.Turf.filter(
          { campaign_id, assigned_to: user.email }
        );
        const turfIds = turfs.map(t => t.id);
        contacts = turfIds.length > 0 
          ? await base44.asServiceRole.entities.Contact.filter({ campaign_id, turf_id: { $in: turfIds } })
          : [];
      } else {
        contacts = await base44.asServiceRole.entities.Contact.filter(
          { campaign_id },
          'name'
        );
      }
    }

    return Response.json({ contacts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});