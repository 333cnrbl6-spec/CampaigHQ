import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
    }

    // Get subscription
    const subscription = await base44.asServiceRole.entities.Subscription.filter({ campaign_id }, '', 1)
      .then(results => results[0] || null);

    if (!subscription) {
      return Response.json({ 
        allowed: false, 
        reason: 'No subscription found',
        status: 'no_subscription'
      }, { status: 400 });
    }

    // Check if trial is still active
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.trial_end_date);
      if (trialEnd < new Date()) {
        return Response.json({
          allowed: false,
          reason: 'Trial period has ended. Please choose a plan.',
          status: 'trial_expired',
        });
      }
      // Trial is active, allow all features
      return Response.json({
        allowed: true,
        reason: 'Trial active',
        status: 'trial_active',
      });
    }

    if (subscription.status === 'past_due') {
      return Response.json({
        allowed: false,
        reason: 'Payment is overdue. Please update your payment method.',
        status: 'payment_overdue',
      });
    }

    if (subscription.status === 'canceled') {
      return Response.json({
        allowed: false,
        reason: 'Subscription has been cancelled.',
        status: 'subscription_canceled',
      });
    }

    if (subscription.status !== 'active') {
      return Response.json({
        allowed: false,
        reason: `Subscription status: ${subscription.status}`,
        status: subscription.status,
      });
    }

    // Get contact count
    const contacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 100000);
    
    // Plan limits
    const planLimits = {
      starter: { contacts: 1000, volunteers: 10 },
      professional: { contacts: 10000, volunteers: 100 },
      enterprise: { contacts: 1000000, volunteers: 1000 },
    };

    const limits = planLimits[subscription.plan] || { contacts: 1000, volunteers: 10 };
    const contactUsage = contacts.length;
    const contactPercent = (contactUsage / limits.contacts) * 100;

    return Response.json({
      allowed: true,
      status: 'active',
      plan: subscription.plan,
      contacts: {
        used: contactUsage,
        limit: limits.contacts,
        percent: Math.round(contactPercent),
      },
      volunteers: {
        limit: limits.volunteers,
      },
    });
  } catch (error) {
    console.error('Plan limits check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});