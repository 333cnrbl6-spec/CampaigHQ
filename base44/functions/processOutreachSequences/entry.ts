import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PLACEHOLDER_MAP = {
  '{{name}}': (c) => c.name || '',
  '{{postcode}}': (c) => c.postcode || '',
  '{{address}}': (c) => c.address || '',
  '{{support_level}}': (c) => c.support_level?.replace('_', ' ') || 'supporter',
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

    const { campaign_id, event_type, contact_id, trigger_value } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch all active sequences matching this event for this campaign
    const sequences = await base44.asServiceRole.entities.OutreachSequence.filter({
      campaign_id,
      trigger_event: event_type,
      status: 'active',
      enabled: true,
    });

    if (!sequences.length) {
      return Response.json({ processed: 0 });
    }

    // Fetch the contact for this campaign
    const allContacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id });
    const contact = allContacts.find(c => c.id === contact_id);
    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    let processed = 0;

    for (const sequence of sequences) {
      // Check if this sequence applies to this contact
      if (sequence.trigger_event === 'support_level_changed' && sequence.trigger_value !== trigger_value) {
        continue;
      }

      // Check contact filters
      if (sequence.filters?.support_level?.length > 0 && !sequence.filters.support_level.includes(contact.support_level)) {
        continue;
      }

      if (sequence.filters?.has_contact_method === 'email' && !contact.email) {
        continue;
      }

      if (sequence.filters?.has_contact_method === 'phone' && !contact.phone) {
        continue;
      }

      // Check if contact already has messages from this sequence
      const existingLogs = await base44.asServiceRole.entities.OutreachLog.filter({
        contact_id,
        sequence_id: sequence.id,
      });

      if (existingLogs.length > 0) {
        continue; // Skip if already processed
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
          contact_id,
          contact_name: contact.name,
          contact_email: contact.email,
          channel: sequence.channel,
          message_index: i,
          status: 'scheduled',
          subject,
          body,
          trigger_event: event_type,
          scheduled_for: scheduledFor,
        });

        processed++;
      }

      // Increment sent_count on sequence
      await base44.asServiceRole.entities.OutreachSequence.update(sequence.id, {
        sent_count: (sequence.sent_count || 0) + sequence.messages.length,
      });
    }

    return Response.json({ processed, sequences_matched: sequences.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});