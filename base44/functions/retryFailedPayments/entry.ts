import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all past_due subscriptions
    const pastDueSubscriptions = await base44.asServiceRole.entities.Subscription.filter(
      { status: 'past_due' },
      '',
      1000
    );

    const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY');
    let retried = 0;
    let escalated = 0;

    for (const sub of pastDueSubscriptions) {
      if (!sub.stripe_subscription_id) continue;

      // Check how long it's been past due
      const createdDate = new Date(sub.created_date);
      const daysPastDue = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));

      // Retry payment
      if (daysPastDue < 7) {
        // Auto-retry within 7 days
        try {
          const invoiceRes = await fetch('https://api.stripe.com/v1/invoices', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${STRIPE_SECRET}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              subscription: sub.stripe_subscription_id,
              amount_due: Math.round(sub.monthly_price * 100),
              customer: sub.stripe_customer_id,
            }).toString(),
          });

          if (invoiceRes.ok) {
            const invoice = await invoiceRes.json();

            // Attempt payment
            const payRes = await fetch(`https://api.stripe.com/v1/invoices/${invoice.id}/pay`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${STRIPE_SECRET}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            });

            if (payRes.ok) {
              await base44.asServiceRole.entities.Subscription.update(sub.id, {
                status: 'active',
              });
              retried++;
              console.log(`Payment retried successfully for ${sub.campaign_id}`);
            }
          }
        } catch (error) {
          console.error(`Failed to retry payment for ${sub.campaign_id}:`, error);
        }
      } else if (daysPastDue === 7) {
        // Escalate to past 7 days
        await base44.asServiceRole.entities.Subscription.update(sub.id, {
          status: 'canceled',
        });
        escalated++;

        // Notify campaign owner
        const campaign = await base44.asServiceRole.entities.Campaign.filter(
          { id: sub.campaign_id },
          '',
          1
        ).then(r => r[0]);

        await base44.integrations.Core.SendEmail({
          to: campaign.owner_email,
          subject: `⛔ Subscription cancelled for ${campaign.name}`,
          body: `<p>Your subscription for <strong>${campaign.name}</strong> has been cancelled due to continued payment failure. Please contact support to restore access.</p>`,
        });

        console.log(`Subscription cancelled for ${sub.campaign_id} after 7 days past due`);
      }
    }

    return Response.json({
      success: true,
      retried,
      escalated,
      total_checked: pastDueSubscriptions.length,
    });
  } catch (error) {
    console.error('Payment retry error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});