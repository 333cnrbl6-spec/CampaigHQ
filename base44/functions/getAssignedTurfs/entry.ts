import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    // Organizers see all turfs
    if (user.role === 'organizer' || user.role === 'admin') {
      const turfs = await base44.asServiceRole.entities.Turf.filter(
        { campaign_id },
        '-updated_date'
      );
      return Response.json({ turfs });
    }

    // Volunteers see only turfs assigned to them
    const allTurfs = await base44.asServiceRole.entities.Turf.filter(
      { campaign_id },
      '-updated_date'
    );

    const assignedTurfs = allTurfs.filter(turf => {
      // Check direct assignment
      if (turf.assigned_to === user.email) return true;
      
      // Check team assignment
      if (turf.assigned_team && Array.isArray(turf.assigned_team)) {
        return turf.assigned_team.includes(user.email);
      }
      
      return false;
    });

    return Response.json({ turfs: assignedTurfs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});