import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient_email, alert_type, campaign_name, subject, message, action_url } = await req.json();

    const emailBody = `
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>${subject}</h2>
    <p style="line-height: 1.6;">${message}</p>
    <p style="color: #666; font-size: 14px;">Campaign: <strong>${campaign_name}</strong></p>
    ${action_url ? `<p><a href="${action_url}" style="background-color: #152B45; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a></p>` : ''}
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #999; font-size: 12px;">This is an automated alert from your campaign platform.</p>
  </div>
</body>
</html>
    `;

    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: subject,
      body: emailBody,
      from_name: `${campaign_name} Campaign Alert`,
    });

    return Response.json({ success: true, message: 'Email alert sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});