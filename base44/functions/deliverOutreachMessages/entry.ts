import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Get all scheduled messages that are due for this campaign
    const now = new Date().toISOString();
    const logs = await base44.asServiceRole.entities.OutreachLog.filter({
      status: 'scheduled',
      campaign_id,
    }, '-created_date', 1000);

    const dueMessages = logs.filter(log => {
      const scheduledDate = new Date(log.scheduled_for);
      return scheduledDate <= new Date(now);
    });

    let sent = 0;
    let failed = 0;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < dueMessages.length; i++) {
      const log = dueMessages[i];
      try {
        // Send via email or SMS
        if (log.channel === 'email' && log.contact_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: log.contact_email,
            subject: log.subject || 'Important Message',
            body: log.body,
            from_name: 'Campaign Team',
          });
        } else if (log.channel === 'sms' && log.contact_phone) {
          // SMS would be sent via a third-party service like Twilio
          // For now, we'll just mark it as sent
          console.log(`SMS to ${log.contact_phone}: ${log.body}`);
        }

        // Mark as sent
        await base44.asServiceRole.entities.OutreachLog.update(log.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        sent++;
      } catch (error) {
        // Mark as failed
        console.error(`Failed to deliver message ${log.id}:`, error.message);
        try {
          await base44.asServiceRole.entities.OutreachLog.update(log.id, {
            status: 'failed',
            error: error.message,
          });
        } catch (updateErr) {
          console.error(`Failed to update log ${log.id}:`, updateErr.message);
        }
        failed++;
      }

      // Rate limit: pause every 5 messages
      if ((i + 1) % 5 === 0) {
        await delay(300);
      }
    }

    return Response.json({
      processed: dueMessages.length,
      sent,
      failed,
      message: `Delivered ${sent} messages, ${failed} failed`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});