import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { subscription_id, campaign_id, recipient_email, amount, billing_date } = await req.json();

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

    const invoiceId = `INV-${subscription_id.slice(0, 8).toUpperCase()}-${new Date().getTime()}`;

    const body = `
<h2>Invoice for ${campaign.name}</h2>
<p>Hi ${campaign.owner_email.split('@')[0]},</p>
<p>Thank you for using our platform. Here's your invoice:</p>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background: #f3f4f6;">
    <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Description</th>
    <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Amount</th>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #e5e7eb;">${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan (Monthly)</td>
    <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">£${amount}</td>
  </tr>
  <tr style="background: #f9fafb;">
    <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total</td>
    <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-weight: bold;">£${amount}</td>
  </tr>
</table>
<p><strong>Invoice ID:</strong> ${invoiceId}</p>
<p><strong>Billing Date:</strong> ${billing_date}</p>
<p>Payment was successfully processed on your card ending in ${subscription.payment_method || '****'}.</p>
<p><a href="https://your-app.com/billing" style="background: #00B140; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Dashboard</a></p>
<p>Thank you for supporting our platform!</p>
    `;

    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: `Invoice ${invoiceId} for ${campaign.name}`,
      body,
    });

    console.log(`Invoice email sent to ${recipient_email}`);

    return Response.json({ success: true, invoice_id: invoiceId, sent_to: recipient_email });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});