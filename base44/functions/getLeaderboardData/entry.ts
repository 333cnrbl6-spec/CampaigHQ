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

    // Fetch all session logs for the campaign
    const allLogs = await base44.asServiceRole.entities.CanvassingLog.filter(
      { campaign_id },
      '-session_date'
    );

    // Aggregate by volunteer
    const volunteerStats = {};
    allLogs.forEach(log => {
      const email = log.volunteer_email;
      if (!volunteerStats[email]) {
        volunteerStats[email] = {
          volunteer_email: email,
          volunteer_name: log.volunteer_name,
          total_doors: 0,
          positive: 0,
          negative: 0,
          undecided: 0,
          sessions: 0
        };
      }
      volunteerStats[email].total_doors += log.doors_knocked || 0;
      volunteerStats[email].positive += log.positive_responses || 0;
      volunteerStats[email].negative += log.negative_responses || 0;
      volunteerStats[email].undecided += log.undecided_count || 0;
      volunteerStats[email].sessions += 1;
    });

    // Convert to array and sort by doors knocked
    const leaderboard = Object.values(volunteerStats).sort(
      (a, b) => b.total_doors - a.total_doors
    );

    const isOrganizer = user.role === 'organizer' || user.role === 'admin';

    if (isOrganizer) {
      // Organizers see full leaderboard
      return Response.json({ leaderboard });
    } else {
      // Volunteers see leaderboard but only see own detailed stats
      const sanitized = leaderboard.map(entry => ({
        volunteer_name: entry.volunteer_name,
        total_doors: entry.total_doors,
        sessions: entry.sessions,
        is_self: entry.volunteer_email === user.email,
        ...( entry.volunteer_email === user.email && { 
          volunteer_email: entry.volunteer_email,
          positive: entry.positive,
          negative: entry.negative,
          undecided: entry.undecided
        })
      }));
      return Response.json({ leaderboard: sanitized });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});