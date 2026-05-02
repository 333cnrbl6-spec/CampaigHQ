import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    // Get all contacts for this campaign
    const contacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 100000);
    
    // Get all volunteer profiles
    const volunteers = await base44.asServiceRole.entities.VolunteerProfile.list('', 10000);
    const campaignVolunteers = volunteers.filter(v => {
      // Volunteers assigned to turfs in this campaign
      const turfs = v.assigned_turf_ids || [];
      return turfs.length > 0;
    });

    // Get current billing period
    const subscription = await base44.asServiceRole.entities.Subscription.filter({ campaign_id }, '', 1)
      .then(results => results[0] || null);

    const today = new Date();
    const billingStart = subscription?.billing_cycle_start ? new Date(subscription.billing_cycle_start) : new Date(today.getFullYear(), today.getMonth(), 1);
    const billingEnd = subscription?.billing_cycle_end ? new Date(subscription.billing_cycle_end) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Count canvassing sessions this period
    const logs = await base44.asServiceRole.entities.CanvassingLog.filter({ campaign_id }, '-session_date', 10000);
    const sessionCount = logs.filter(log => {
      const logDate = new Date(log.session_date);
      return logDate >= billingStart && logDate <= billingEnd;
    }).length;

    // Get plan limits
    const planLimits = {
      starter: { contacts: 1000, volunteers: 10 },
      professional: { contacts: 10000, volunteers: 100 },
      enterprise: { contacts: 1000000, volunteers: 1000 },
    };

    const limits = planLimits[subscription?.plan] || { contacts: 1000, volunteers: 10 };
    const overage_contacts = Math.max(0, contacts.length - limits.contacts);
    const overage_volunteers = Math.max(0, campaignVolunteers.length - limits.volunteers);

    // Update or create usage metrics
    const existing = await base44.asServiceRole.entities.UsageMetrics.filter({ campaign_id }, '', 1)
      .then(results => results[0] || null);

    const usageData = {
      campaign_id,
      billing_period_start: billingStart.toISOString().split('T')[0],
      billing_period_end: billingEnd.toISOString().split('T')[0],
      contacts_created: contacts.length,
      active_volunteers: campaignVolunteers.length,
      canvassing_sessions: sessionCount,
      overage_contacts,
      overage_volunteers,
      overage_charges: (overage_contacts * 0.01) + (overage_volunteers * 1), // Rough calculation
    };

    if (existing) {
      await base44.asServiceRole.entities.UsageMetrics.update(existing.id, usageData);
    } else {
      await base44.asServiceRole.entities.UsageMetrics.create(usageData);
    }

    return Response.json({ success: true, metrics: usageData });
  } catch (error) {
    console.error('Usage metrics update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});