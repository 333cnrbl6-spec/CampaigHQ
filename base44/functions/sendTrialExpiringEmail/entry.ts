import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscription_id, campaign_id, recipient_email } = await req.json();

    if (!subscription_id || !recipient_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscription = await base44.asServiceRole.entities.Subscription.filter(
      { id: subscription_id },
      '',
      1
    ).then(r => r[0]);

    const campaign = await base44.asServiceRole.entities.Campaign.filter(
      { id: campaign_id },
      '',
      1
    ).then(r => r[0]);

    const daysLeft = Math.ceil(
      (new Date(subscription.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const body = `
<h2>Your ${campaign.name} trial is expiring soon!</h2>
<p>Hi ${campaign.owner_email.split('@')[0]},</p>
<p>Your 7-day free trial for <strong>${campaign.name}</strong> expires in <strong>${daysLeft} days</strong> on ${subscription.trial_end_date}.</p>
<p>Choose a plan to continue:</p>
<ul>
  <li><strong>Starter (£99/mo)</strong> - 1,000 contacts, 10 volunteers</li>
  <li><strong>Professional (£299/mo)</strong> - 10,000 contacts, 100 volunteers</li>
  <li><strong>Enterprise</strong> - Custom pricing for unlimited features</li>
</ul>
<p><a href="https://your-app.com/billing" style="background: #00B140; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Choose Your Plan</a></p>
<p>Questions? Reply to this email or contact support.</p>
    `;

    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `Your ${campaign.name} trial expires in ${daysLeft} days`,
      body,
    });

    console.log(`Trial expiring email sent to ${recipient_email}`);

    return Response.json({ success: true, sent_to: recipient_email });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});