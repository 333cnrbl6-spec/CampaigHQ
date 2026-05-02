import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id, session_date, doors_knocked, positive_responses, negative_responses, no_answers, street_name, turf_id, general_notes } = body;

    if (!campaign_id || !session_date || doors_knocked === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auto-populate volunteer info from current user
    const sessionData = {
      campaign_id,
      volunteer_name: user.full_name || user.email,
      volunteer_email: user.email,
      session_date,
      doors_knocked,
      positive_responses: positive_responses || 0,
      negative_responses: negative_responses || 0,
      no_answers: no_answers || 0,
      street_name: street_name || '',
      turf_id: turf_id || '',
      general_notes: general_notes || ''
    };

    // Create canvassing log
    const log = await base44.asServiceRole.entities.CanvassingLog.create(sessionData);

    return Response.json({ log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});