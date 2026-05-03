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

    // Find all scheduled messages that are due for this campaign
    const now = new Date().toISOString();
    const logs = await base44.asServiceRole.entities.OutreachLog.filter({
      campaign_id,
      status: 'scheduled',
    });

    const dueLogs = logs.filter(log => log.scheduled_for <= now);

    let delivered = 0;
    let failed = 0;
    let skipped = 0;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < dueLogs.length; i++) {
      const log = dueLogs[i];
      try {
        if (log.channel === 'email' && log.contact_email) {
          // Send email via Base44 integration
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: log.contact_email,
            subject: log.subject,
            body: log.body,
            from_name: 'Campaign Team',
          });

          await base44.asServiceRole.entities.OutreachLog.update(log.id, {
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          delivered++;
        } else if (log.channel === 'sms') {
          // SMS would require Twilio integration
          // For now, mark as skipped
          await base44.asServiceRole.entities.OutreachLog.update(log.id, {
            status: 'skipped',
            error: 'SMS delivery requires Twilio integration',
          });
          skipped++;
        }
      } catch (error) {
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

    return Response.json({ delivered, failed, skipped, total: dueLogs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});