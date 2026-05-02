import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all campaigns
    const campaigns = await base44.asServiceRole.entities.Campaign.list('name', 5000);
    const contacts = await base44.asServiceRole.entities.Contact.list('name', 10000);
    const logs = await base44.asServiceRole.entities.CanvassingLog.list('session_date', 10000);

    // Calculate metrics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalContacts = contacts.length;
    const canvassedContacts = contacts.filter(c => c.canvassed).length;
    const canvassingRate = totalContacts > 0 ? ((canvassedContacts / totalContacts) * 100).toFixed(1) : 0;

    const totalDoorsKnocked = logs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0);
    const totalLeafletsDelivered = logs.reduce((sum, log) => sum + (log.leaflets_delivered || 0), 0);
    const totalPositiveResponses = logs.reduce((sum, log) => sum + (log.positive_responses || 0), 0);
    const positiveRate = totalDoorsKnocked > 0 ? ((totalPositiveResponses / totalDoorsKnocked) * 100).toFixed(1) : 0;

    // Group by support level
    const supportBreakdown = {
      strong_supporter: contacts.filter(c => c.support_level === 'strong_supporter').length,
      leaning: contacts.filter(c => c.support_level === 'leaning').length,
      undecided: contacts.filter(c => c.support_level === 'undecided').length,
      opposed: contacts.filter(c => c.support_level === 'opposed').length,
    };

    // Campaign-level metrics
    const campaignMetrics = campaigns.map(campaign => {
      const campaignContacts = contacts.filter(c => c.campaign_id === campaign.id);
      const campaignLogs = logs.filter(l => l.campaign_id === campaign.id);
      const canvassed = campaignContacts.filter(c => c.canvassed).length;
      const totalKnocked = campaignLogs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0);

      return {
        id: campaign.id,
        name: campaign.name,
        candidate: campaign.candidate_name,
        constituency: campaign.constituency,
        status: campaign.status,
        contactCount: campaignContacts.length,
        canvassedCount: canvassed,
        canvassingProgress: campaignContacts.length > 0 ? ((canvassed / campaignContacts.length) * 100).toFixed(1) : 0,
        doorsKnocked: totalKnocked,
        leafletsDelivered: campaignLogs.reduce((sum, log) => sum + (log.leaflets_delivered || 0), 0),
      };
    });

    // Trend data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = logs.filter(log => log.session_date === dateStr);
      return {
        date: dateStr,
        doorsKnocked: daySessions.reduce((sum, log) => sum + (log.doors_knocked || 0), 0),
        leafletsDelivered: daySessions.reduce((sum, log) => sum + (log.leaflets_delivered || 0), 0),
      };
    });

    return Response.json({
      timestamp: new Date().toISOString(),
      nationalMetrics: {
        totalCampaigns,
        activeCampaigns,
        totalContacts,
        canvassedContacts,
        canvassingRate: parseFloat(canvassingRate),
        totalDoorsKnocked,
        totalLeafletsDelivered,
        totalPositiveResponses,
        positiveRate: parseFloat(positiveRate),
      },
      supportBreakdown,
      campaignMetrics: campaignMetrics.sort((a, b) => parseFloat(b.canvassingProgress) - parseFloat(a.canvassingProgress)),
      trend7Days: last7Days,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});