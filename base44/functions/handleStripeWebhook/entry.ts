import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'test_secret';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle subscription events
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const campaignId = subscription.metadata?.campaign_id;

      if (campaignId) {
        const planMap = {
          'price_starter': 'starter',
          'price_professional': 'professional',
          'price_enterprise': 'enterprise',
        };

        const plan = planMap[subscription.items.data[0].price.id] || 'starter';
        const status = subscription.status === 'active' ? 'active' : subscription.status;

        // Update or create subscription record
        const existing = await base44.asServiceRole.entities.Subscription.filter({ campaign_id: campaignId }, '', 1)
          .then(results => results[0] || null);

        if (existing) {
          await base44.asServiceRole.entities.Subscription.update(existing.id, {
            stripe_subscription_id: subscription.id,
            plan,
            status,
            billing_cycle_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
            billing_cycle_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
          });
        } else {
          await base44.asServiceRole.entities.Subscription.create({
            campaign_id: campaignId,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            plan,
            status,
            billing_cycle_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
            billing_cycle_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
            next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
          });
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const campaignId = subscription.metadata?.campaign_id;

      if (campaignId) {
        const existing = await base44.asServiceRole.entities.Subscription.filter({ campaign_id: campaignId }, '', 1)
          .then(results => results[0] || null);

        if (existing) {
          await base44.asServiceRole.entities.Subscription.update(existing.id, {
            status: 'canceled',
            canceled_at: new Date().toISOString().split('T')[0],
          });
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      console.log(`Payment succeeded for invoice ${invoice.id}`);
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      console.log(`Payment failed for invoice ${invoice.id}`);
      // TODO: Send email notification
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});