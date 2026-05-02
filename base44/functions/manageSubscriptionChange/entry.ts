import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscription_id, new_plan, action } = await req.json();

    if (!subscription_id || !new_plan || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscription = await base44.asServiceRole.entities.Subscription.filter(
      { id: subscription_id },
      '',
      1
    ).then(r => r[0]);

    if (!subscription) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const planPrices = { starter: 99, professional: 299, enterprise: 0 };
    const newPrice = planPrices[new_plan] || 0;
    const oldPrice = planPrices[subscription.plan] || 0;

    let creditUsed = 0;
    let prorationAmount = 0;

    // Calculate proration if mid-cycle
    if (subscription.status === 'active' && subscription.billing_cycle_end) {
      const daysRemaining = Math.ceil(
        (new Date(subscription.billing_cycle_end) - new Date()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = Math.ceil(
        (new Date(subscription.billing_cycle_end) - new Date(subscription.billing_cycle_start)) / (1000 * 60 * 60 * 24)
      );

      prorationAmount = ((newPrice - oldPrice) * daysRemaining) / totalDays;
    }

    // Update subscription
    await base44.asServiceRole.entities.Subscription.update(subscription_id, {
      plan: new_plan,
      monthly_price: newPrice,
      contact_limit: { starter: 1000, professional: 10000, enterprise: 1000000 }[new_plan],
      volunteer_limit: { starter: 10, professional: 100, enterprise: 1000 }[new_plan],
    });

    // Log the change
    await base44.asServiceRole.entities.AuditLog.create({
      campaign_id: subscription.campaign_id,
      user_email: subscription.created_by,
      action: 'update',
      entity_type: 'subscription',
      entity_id: subscription_id,
      new_values: { plan: new_plan, proration: prorationAmount },
    });

    return Response.json({
      success: true,
      new_plan,
      old_plan: subscription.plan,
      proration_amount: prorationAmount,
      new_price: newPrice,
      effective_date: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Subscription change error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});