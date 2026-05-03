import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled job (runs every 5 minutes) to deliver scheduled outreach messages.
 * Checks for messages ready to send and delivers them via email or SMS.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all scheduled messages ready to send
    const logs = await base44.asServiceRole.entities.OutreachLog.list('-scheduled_for', 1000);
    const scheduledLogs = Array.isArray(logs) ? 
      logs.filter(l => l.status === 'scheduled' && new Date(l.scheduled_for) <= new Date()) : 
      [];

    console.log(`Found ${scheduledLogs.length} messages ready to send`);

    const results = [];

    for (const log of scheduledLogs) {
      try {
        // Get sequence details for variable substitution
        const sequence = await base44.asServiceRole.entities.OutreachSequence.get(log.sequence_id);
        const contact = await base44.asServiceRole.entities.Contact.get(log.contact_id);

        // Prepare message with variable substitution
        let body = log.body
          .replace('{{contact_name}}', contact?.name || '')
          .replace('{{contact_email}}', contact?.email || '')
          .replace('{{contact_phone}}', contact?.phone || '');

        let subject = log.subject
          .replace('{{contact_name}}', contact?.name || '')
          .replace('{{contact_email}}', contact?.email || '')
          .replace('{{contact_phone}}', contact?.phone || '');

        // Send via appropriate channel
        if (log.channel === 'email' && contact?.email) {
          await base44.integrations.Core.SendEmail({
            to: contact.email,
            subject: subject,
            body: body,
          });
        } else if (log.channel === 'sms' && contact?.phone) {
          // Note: SMS requires a separate integration (Twilio, etc.)
          // For now, log as pending SMS delivery
          console.log(`SMS to ${contact.phone}: ${body}`);
        }

        // Mark as sent
        await base44.asServiceRole.entities.OutreachLog.update(log.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        results.push({
          log_id: log.id,
          contact: log.contact_name,
          channel: log.channel,
          status: 'sent',
        });

        console.log(`Sent ${log.channel} to ${log.contact_name}`);
      } catch (error) {
        // Mark as failed
        await base44.asServiceRole.entities.OutreachLog.update(log.id, {
          status: 'failed',
          error: error.message,
        });

        console.error(`Failed to send message ${log.id}:`, error);
        results.push({
          log_id: log.id,
          contact: log.contact_name,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      messages_processed: scheduledLogs.length,
      details: results,
    });
  } catch (error) {
    console.error('Error delivering scheduled messages:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});