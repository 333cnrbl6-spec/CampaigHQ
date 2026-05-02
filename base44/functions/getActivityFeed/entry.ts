import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id, limit = 50 } = body;

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    const isOrganizer = user.role === 'organizer' || user.role === 'admin';

    if (isOrganizer) {
      // Organizers see all campaign activity
      const sessions = await base44.asServiceRole.entities.CanvassingLog.filter(
        { campaign_id },
        '-session_date',
        limit
      );
      return Response.json({ activity: sessions });
    } else {
      // Volunteers see only their own activity
      const sessions = await base44.asServiceRole.entities.CanvassingLog.filter(
        { campaign_id, volunteer_email: user.email },
        '-session_date',
        limit
      );
      return Response.json({ activity: sessions });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});