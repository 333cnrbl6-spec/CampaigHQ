import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, report_type = 'full' } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id required' }, { status: 400 });
    }

    // Fetch campaign data
    const campaign = await base44.entities.Campaign.get(campaign_id);
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Fetch related data
    const contacts = await base44.entities.Contact.filter(
      { campaign_id: campaign_id },
      '-created_date',
      5000
    );
    const interactions = await base44.entities.ContactInteraction.filter(
      { contact_id: contacts.map(c => c.id) },
      '-date',
      10000
    );
    const events = await base44.entities.CampaignEvent.filter(
      { campaign_id: campaign_id },
      '-date',
      1000
    );
    const volunteers = await base44.entities.VolunteerProfile.list('-updated_date', 1000);

    // Calculate key metrics
    const canvassedCount = contacts.filter(c => c.canvassed).length;
    const canvassPercent = contacts.length > 0 ? Math.round((canvassedCount / contacts.length) * 100) : 0;
    
    const supportBreakdown = {
      strong_supporter: contacts.filter(c => c.support_level === 'strong_supporter').length,
      leaning: contacts.filter(c => c.support_level === 'leaning').length,
      undecided: contacts.filter(c => c.support_level === 'undecided').length,
      opposed: contacts.filter(c => c.support_level === 'opposed').length,
      unknown: contacts.filter(c => c.support_level === 'unknown').length,
    };

    const volunteerMetrics = volunteers.map(v => ({
      name: v.full_name,
      email: v.user_email,
      interactions: interactions.filter(i => i.logged_by === v.user_email).length,
      door_knocks: interactions.filter(i => i.logged_by === v.user_email && i.type === 'door_knock').length,
    })).filter(v => v.interactions > 0).sort((a, b) => b.interactions - a.interactions);

    const interactionsByType = {
      door_knock: interactions.filter(i => i.type === 'door_knock').length,
      phone_call: interactions.filter(i => i.type === 'phone_call').length,
      email: interactions.filter(i => i.type === 'email').length,
      text: interactions.filter(i => i.type === 'text').length,
      meeting: interactions.filter(i => i.type === 'meeting').length,
    };

    const outcomeMetrics = {
      positive: interactions.filter(i => i.outcome === 'positive').length,
      neutral: interactions.filter(i => i.outcome === 'neutral').length,
      negative: interactions.filter(i => i.outcome === 'negative').length,
      no_answer: interactions.filter(i => i.outcome === 'no_answer').length,
    };

    const report = {
      campaign_id,
      campaign_name: campaign.name,
      report_type,
      generated_date: new Date().toISOString(),
      period: `Generated ${new Date().toLocaleDateString()}`,
      summary: {
        total_contacts: contacts.length,
        canvassed: canvassedCount,
        canvass_coverage_percent: canvassPercent,
        total_volunteers: volunteers.length,
        active_volunteers: volunteerMetrics.length,
        total_interactions: interactions.length,
        completed_events: events.filter(e => e.status === 'completed').length,
        upcoming_events: events.filter(e => e.status === 'upcoming').length,
      },
      support_breakdown: supportBreakdown,
      interaction_methods: interactionsByType,
      interaction_outcomes: outcomeMetrics,
      top_volunteers: volunteerMetrics.slice(0, 10),
      campaign_details: {
        party: campaign.party || 'N/A',
        constituency: campaign.constituency || 'N/A',
        candidate: campaign.candidate_name || 'N/A',
        election_date: campaign.election_date || 'N/A',
        status: campaign.status,
      }
    };

    console.log(`Report generated for campaign ${campaign_id}:`, {
      contacts: report.summary.total_contacts,
      interactions: report.summary.total_interactions,
      volunteers: report.summary.active_volunteers
    });

    return Response.json(report);
  } catch (error) {
    console.error('Report generation error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});