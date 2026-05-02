import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PLACEHOLDER_MAP = {
  '{{name}}': (c) => c.name || '',
  '{{postcode}}': (c) => c.postcode || '',
  '{{address}}': (c) => c.address || '',
  '{{support_level}}': (c) => c.support_level?.replace(/_/g, ' ') || 'supporter',
};

const interpolateMessage = (template, contact) => {
  let result = template;
  Object.entries(PLACEHOLDER_MAP).forEach(([placeholder, getter]) => {
    result = result.replace(new RegExp(placeholder, 'g'), getter(contact));
  });
  return result;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    // Only process Contact update events where support_level changed
    if (event.type !== 'update' || event.entity_name !== 'Contact') {
      return Response.json({ processed: 0 });
    }

    const contact = data;
    if (!contact || !contact.support_level || !contact.campaign_id) {
      return Response.json({ processed: 0 });
    }

    // Get all active sequences for this campaign
    const sequences = await base44.asServiceRole.entities.OutreachSequence.filter({
      campaign_id: contact.campaign_id,
      status: 'active',
      trigger_event: 'support_level_changed'
    });
    const activeSequences = sequences;

    let processed = 0;

    for (const sequence of activeSequences) {
      // Only trigger if support level matches
      if (sequence.trigger_value !== contact.support_level) {
        continue;
      }

      // Check contact filters
      if (sequence.filters?.support_level?.length > 0 && 
          !sequence.filters.support_level.includes(contact.support_level)) {
        continue;
      }

      if (sequence.filters?.has_contact_method === 'email' && !contact.email) {
        continue;
      }

      if (sequence.filters?.has_contact_method === 'phone' && !contact.phone) {
        continue;
      }

      // Check if contact already has messages from this sequence to prevent duplicates
      const existingLogs = await base44.asServiceRole.entities.OutreachLog.filter({
        contact_id: contact.id,
        sequence_id: sequence.id,
      }, '-created_date', 1);

      // Only skip if a message was sent in the last 30 days
      if (existingLogs.length > 0) {
        const lastLog = existingLogs[0];
        const daysSince = (Date.now() - new Date(lastLog.created_date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          continue;
        }
      }

      // Create logs for each message in the sequence
      for (let i = 0; i < sequence.messages.length; i++) {
        const msg = sequence.messages[i];
        const delayMs = msg.delay_hours * 60 * 60 * 1000;
        const scheduledFor = new Date(Date.now() + delayMs).toISOString();

        const body = interpolateMessage(msg.body, contact);
        const subject = msg.subject ? interpolateMessage(msg.subject, contact) : null;

        await base44.asServiceRole.entities.OutreachLog.create({
          sequence_id: sequence.id,
          contact_id: contact.id,
          contact_name: contact.name,
          contact_email: contact.email,
          channel: sequence.channel,
          message_index: i,
          status: 'scheduled',
          subject,
          body,
          trigger_event: 'support_level_changed',
          scheduled_for: scheduledFor,
        });

        processed++;
      }

      // Increment sent_count on sequence
      await base44.asServiceRole.entities.OutreachSequence.update(sequence.id, {
        sent_count: (sequence.sent_count || 0) + sequence.messages.length,
      });
    }

    return Response.json({ processed, contact_id: contact.id, support_level: contact.support_level });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});