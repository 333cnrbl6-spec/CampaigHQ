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
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch data for this campaign in parallel
    const today = new Date().toISOString().split('T')[0];
    const [canvassingLogs, turfs, tasks] = await Promise.all([
      base44.asServiceRole.entities.CanvassingLog.filter({ campaign_id, session_date: today }),
      base44.asServiceRole.entities.Turf.filter({ campaign_id }),
      base44.asServiceRole.entities.Task.filter({ campaign_id, category: 'canvassing' }),
    ]);

    // Get daily goal from tasks or default to 100
    const dailyGoalTask = tasks.find(t => t.title?.toLowerCase().includes('daily'));
    const dailyGoal = dailyGoalTask?.description ? parseInt(dailyGoalTask.description) : 100;

    // Build volunteer progress map from today's logs
    const volunteerProgress = {};
    canvassingLogs.forEach(log => {
      const email = log.volunteer_email;
      if (!volunteerProgress[email]) {
        volunteerProgress[email] = {
          name: log.volunteer_name,
          email,
          doorsKnocked: 0,
          positiveResponses: 0,
          negativeResponses: 0,
          undecidedCount: 0,
          sessionsCount: 0,
          streets: new Set(),
        };
      }
      volunteerProgress[email].doorsKnocked += log.doors_knocked || 0;
      volunteerProgress[email].positiveResponses += log.positive_responses || 0;
      volunteerProgress[email].negativeResponses += log.negative_responses || 0;
      volunteerProgress[email].undecidedCount += log.undecided_count || 0;
      volunteerProgress[email].sessionsCount += 1;
      if (log.street_name) {
        volunteerProgress[email].streets.add(log.street_name);
      }
    });

    // Find unassigned turfs as suggestions
    const unassignedTurfs = turfs.filter(t => !t.assigned_to && (!t.assigned_team || t.assigned_team.length === 0));
    const priorityTurfs = unassignedTurfs.filter(t => t.priority === 'high' || t.priority === 'urgent');
    const suggestedTurf = priorityTurfs.length > 0 ? priorityTurfs[0] : unassignedTurfs[0];

    // Build summary messages
    const summaries = [];

    Object.entries(volunteerProgress).forEach(([email, progress]) => {
      const progressPct = Math.round((progress.doorsKnocked / dailyGoal) * 100);
      const goalReached = progress.doorsKnocked >= dailyGoal;
      const remaining = Math.max(0, dailyGoal - progress.doorsKnocked);

      // Build email subject and body
      const subject = `Daily Summary - ${progressPct}% of Goal ${goalReached ? '✓ ACHIEVED!' : 'in progress'}`;

      const emailBody = `
Hi ${progress.name || email.split('@')[0]},

Your canvassing progress for today:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Doors Knocked: ${progress.doorsKnocked} / ${dailyGoal}
📈 Progress: ${progressPct}%
${goalReached ? '✓ Goal Achieved! 🎉' : `📌 Remaining: ${remaining} doors`}

📞 Sessions: ${progress.sessionsCount}
👍 Positive Responses: ${progress.positiveResponses}
👎 Negative Responses: ${progress.negativeResponses}
❓ Undecided: ${progress.undecidedCount}

${suggestedTurf ? `
Next Priority Area:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Turf Zone: ${suggestedTurf.name}
${suggestedTurf.priority ? `⚠️ Priority: ${suggestedTurf.priority.toUpperCase()}` : ''}
${suggestedTurf.contact_count ? `📍 Contacts: ~${suggestedTurf.contact_count}` : ''}
${suggestedTurf.notes ? `📝 Notes: ${suggestedTurf.notes}` : ''}
` : ''}

Great work today! Keep up the momentum.

---
Campaign Management System
      `.trim();

      summaries.push({
        to: email,
        subject,
        body: emailBody,
        volunteer_email: email,
        sent_at: new Date().toISOString(),
      });
    });

    // Send summaries via email (batch)
    if (summaries.length > 0) {
      for (const summary of summaries) {
        try {
          await base44.integrations.Core.SendEmail({
            to: summary.to,
            subject: summary.subject,
            body: summary.body,
            from_name: 'Campaign Manager',
          });
        } catch (err) {
          console.error(`Failed to send summary to ${summary.to}:`, err.message);
        }
      }
    }

    return Response.json({
      success: true,
      message: `Sent ${summaries.length} volunteer summaries`,
      summaries: summaries.map(s => ({ email: s.to, doors_knocked: volunteerProgress[s.to]?.doorsKnocked || 0 })),
    });
  } catch (error) {
    console.error('Error sending volunteer summaries:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});