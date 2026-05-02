import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@16.7.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, plan } = await req.json();

    if (!campaign_id || !plan) {
      return Response.json({ error: 'Missing campaign_id or plan' }, { status: 400 });
    }

    // Verify user owns this campaign
    const campaign = await base44.entities.Campaign.get(campaign_id);
    if (campaign.owner_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Plan details (GBP)
    const plans = {
      starter: { price: 9900, name: 'Starter', contacts: 1000, volunteers: 10 },
      professional: { price: 29900, name: 'Professional', contacts: 10000, volunteers: 100 },
      enterprise: { price: 99900, name: 'Enterprise', contacts: 1000000, volunteers: 1000 },
    };

    if (!plans[plan]) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get or create Stripe customer
    let subscription = await base44.entities.Subscription.filter({ campaign_id }, '', 1)
      .then(results => results[0] || null);

    let stripeCustomerId;
    if (subscription && subscription.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: campaign.name,
        metadata: {
          campaign_id,
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
        },
      });
      stripeCustomerId = customer.id;
    }

    // Create or get product
    const productName = `${campaign.name} - ${plans[plan].name}`;
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: productName,
              description: `${plans[plan].name} plan - ${plans[plan].contacts.toLocaleString()} contacts, ${plans[plan].volunteers} volunteers`,
            },
            unit_amount: plans[plan].price,
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/billing?success=true&campaign_id=${campaign_id}`,
      cancel_url: `${req.headers.get('origin')}/billing?canceled=true`,
      metadata: {
        campaign_id,
        plan,
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
      },
    });

    // Store Stripe customer ID if new
    if (!subscription) {
      await base44.entities.Subscription.create({
        campaign_id,
        stripe_customer_id: stripeCustomerId,
        plan,
        status: 'trial',
        trial_start_date: new Date().toISOString().split('T')[0],
        trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});