import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscription_id, campaign_id, recipient_email, failure_reason } = await req.json();

    if (!subscription_id || !recipient_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await base44.asServiceRole.entities.Campaign.filter(
      { id: campaign_id },
      '',
      1
    ).then(r => r[0]);

    const body = `
<h2>Payment failed for ${campaign.name}</h2>
<p>Hi ${campaign.owner_email.split('@')[0]},</p>
<p>We couldn't process your payment for <strong>${campaign.name}</strong>.</p>
<p><strong>Reason:</strong> ${failure_reason || 'Card declined or expired'}</p>
<p>Your campaign will continue to operate normally, but if we can't collect payment within 7 days, your access will be suspended.</p>
<p><a href="https://your-app.com/billing" style="background: #f87171; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Payment Method</a></p>
<p>We'll retry your payment automatically. If you have questions, contact support.</p>
    `;

    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `⚠️ Payment failed for ${campaign.name}`,
      body,
    });

    console.log(`Payment failed email sent to ${recipient_email}`);

    return Response.json({ success: true, sent_to: recipient_email });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});