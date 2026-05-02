import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id, contact_id, type, date, outcome, notes } = body;

    if (!campaign_id || !contact_id || !type || !date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch contact to verify it exists and access is allowed
    const contact = await base44.asServiceRole.entities.Contact.get(contact_id);

    if (!contact || contact.campaign_id !== campaign_id) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    // For volunteers: verify access to contact's turf
    if (user.role !== 'organizer' && user.role !== 'admin') {
      const turf = await base44.asServiceRole.entities.Turf.get(contact.turf_id);
      
      if (!turf) {
        return Response.json({ error: 'Contact turf not found' }, { status: 404 });
      }

      const isAssigned = turf.assigned_to === user.email || 
                         (turf.assigned_team && turf.assigned_team.includes(user.email));

      if (!isAssigned) {
        return Response.json({ error: 'Access denied to this contact' }, { status: 403 });
      }
    }

    // Create interaction log with logged_by set to current user
    const interactionData = {
      contact_id,
      type,
      date,
      outcome: outcome || 'neutral',
      notes: notes || '',
      logged_by: user.email
    };

    const interaction = await base44.asServiceRole.entities.ContactInteraction.create(interactionData);

    return Response.json({ interaction });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});