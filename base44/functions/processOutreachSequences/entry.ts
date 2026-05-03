import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Processes outreach sequences triggered by contact interactions.
 * Schedules and sends messages based on triggers.
 * 
 * Can be called:
 * - Via automation on ContactInteraction creation
 * - Via entity automation on Contact update
 * - Via scheduled job
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { trigger_event, contact_id, trigger_value } = body;

    // Get contact and sequences
    const contact = contact_id ? 
      await base44.entities.Contact.get(contact_id) : null;
    
    const sequences = await base44.entities.OutreachSequence.list('-created_date', 500);
    const allSequences = Array.isArray(sequences) ? sequences : [];

    // Filter sequences that match this trigger
    const matchingSequences = allSequences.filter(seq => {
      if (seq.status !== 'active') return false;
      if (seq.trigger_event !== trigger_event) return false;
      
      // Match trigger value if specified
      if (seq.trigger_value && seq.trigger_value !== trigger_value) {
        return false;
      }

      // Check filters
      if (seq.filters?.support_level && contact && !seq.filters.support_level.includes(contact.support_level)) {
        return false;
      }

      if (seq.filters?.registered_voter && contact && !contact.registered_voter) {
        return false;
      }

      if (seq.filters?.has_contact_method) {
        if (seq.filters.has_contact_method === 'email' && !contact?.email) return false;
        if (seq.filters.has_contact_method === 'phone' && !contact?.phone) return false;
      }

      return true;
    });

    console.log(`Found ${matchingSequences.length} matching sequences for ${trigger_event}`);

    const results = [];

    // Process each matching sequence
    for (const sequence of matchingSequences) {
      if (!contact) continue;

      // Check contact has required communication method
      const canEmail = sequence.channel === 'email' && contact.email;
      const canSms = sequence.channel === 'sms' && contact.phone;

      if (!canEmail && !canSms) {
        console.log(`Skipping sequence ${sequence.id}: contact has no ${sequence.channel}`);
        continue;
      }

      // Schedule each message in the sequence
      for (let msgIdx = 0; msgIdx < sequence.messages.length; msgIdx++) {
        const msg = sequence.messages[msgIdx];
        const delayMs = (msg.delay_hours || 0) * 3600 * 1000;
        const scheduledTime = new Date(Date.now() + delayMs).toISOString();

        // Create outreach log entry
        const logEntry = await base44.entities.OutreachLog.create({
          sequence_id: sequence.id,
          contact_id: contact.id,
          contact_name: contact.name,
          contact_email: contact.email,
          channel: sequence.channel,
          message_index: msgIdx,
          status: 'scheduled',
          subject: msg.subject,
          body: msg.body,
          trigger_event,
          scheduled_for: scheduledTime,
        });

        results.push({
          sequence: sequence.name,
          contact: contact.name,
          message: msgIdx + 1,
          scheduled_for: scheduledTime,
          log_id: logEntry.id,
        });

        console.log(`Scheduled message ${msgIdx + 1} of sequence ${sequence.name} for ${contact.name}`);
      }

      // Update sequence sent count
      const currentCount = sequence.sent_count || 0;
      await base44.entities.OutreachSequence.update(sequence.id, {
        sent_count: currentCount + 1,
      });
    }

    return Response.json({
      success: true,
      sequences_triggered: matchingSequences.length,
      messages_scheduled: results.length,
      details: results,
    });
  } catch (error) {
    console.error('Error processing outreach sequences:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});