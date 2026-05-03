import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaign from context or request body
    const { campaign_id, tag_filters } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id required' }, { status: 400 });
    }

    // Fetch campaign to get election date
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: campaign_id });
    if (!campaigns || campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const campaign = campaigns[0];
    const electionDate = new Date(campaign.election_date);
    const now = new Date();
    const hoursUntilElection = (electionDate - now) / (1000 * 60 * 60);

    // Check if we're within 48 hours of election
    if (hoursUntilElection < 0 || hoursUntilElection > 48) {
      return Response.json({
        status: 'skipped',
        reason: `Not within 48 hours of election. Hours remaining: ${hoursUntilElection.toFixed(1)}`,
      });
    }

    // Build contact query filters
    let contactQuery = { campaign_id };

    // Apply tag filters if provided (e.g., only "strong_supporter", "leaning")
    if (tag_filters && tag_filters.length > 0) {
      // Note: For tag-based filtering, we'd typically need custom RLS or filter in app
      // For now, we'll fetch all and filter by support level or custom tags
    }

    // Fetch contacts with phone/email and support levels
    const contacts = await base44.asServiceRole.entities.Contact.filter(contactQuery, '-updated_date', 1000);
    
    const validContacts = contacts.filter(c => (c.email || c.phone) && c.support_level !== 'opposed');
    
    console.log(`Found ${validContacts.length} contacts for GOTV reminders`);

    // Track delivery stats
    let emailsSent = 0;
    let smsSent = 0;
    let failed = 0;

    // Send personalized messages
    for (const contact of validContacts) {
      try {
        const personalized = {
          name: contact.name || 'Voter',
          area: campaign.area,
          electionDate: campaign.election_date,
          candidate: campaign.candidate_name,
        };

        // Send email if available
        if (contact.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: contact.email,
              subject: `${campaign.candidate_name} needs your vote on ${campaign.election_date}`,
              body: generateEmailBody(personalized, campaign),
            });
            emailsSent++;
          } catch (emailErr) {
            console.error(`Email failed for ${contact.email}:`, emailErr.message);
            failed++;
          }
        }

        // Send SMS if available (requires SMS integration setup)
        if (contact.phone && false) { // SMS disabled until SMS integration configured
          try {
            const smsBody = `${campaign.candidate_name} needs your vote on ${campaign.election_date}. Head to your polling station and vote Green. ${campaign.constituency}`;
            // Would call SMS service here
            smsSent++;
          } catch (smsErr) {
            console.error(`SMS failed for ${contact.phone}:`, smsErr.message);
            failed++;
          }
        }
      } catch (err) {
        console.error(`Failed to process contact ${contact.id}:`, err.message);
        failed++;
      }
    }

    // Log the campaign event
    try {
      await base44.asServiceRole.entities.OutreachLog.create({
        campaign_id,
        sequence_name: 'GOTV_48H_Reminder',
        message_type: 'email_sms',
        recipients_count: validContacts.length,
        sent_count: emailsSent + smsSent,
        failed_count: failed,
        sent_date: new Date().toISOString().split('T')[0],
      });
    } catch (logErr) {
      console.error('Failed to log outreach:', logErr.message);
    }

    return Response.json({
      status: 'success',
      campaign: campaign.name,
      hoursUntilElection: hoursUntilElection.toFixed(1),
      contactsTargeted: validContacts.length,
      emailsSent,
      smsSent,
      failed,
    });
  } catch (error) {
    console.error('GOTV reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateEmailBody(contact, campaign) {
  return `
Hi ${contact.name},

The election is just 48 hours away. Now is the time to make sure your vote counts.

On ${campaign.electionDate}, vote for ${campaign.candidate} to bring real change to ${campaign.area}.

**Why vote Green?**
- Real action on climate and environment
- Fair deal on wages and housing
- Proper investment in the NHS

**Don't forget:**
✓ Check your polling station at www.getyourpollingstation.com
✓ Take ID (passport, driving licence, or proof of address)
✓ Voting is between 7am-10pm on election day

Every vote counts. We're counting on you.

${campaign.name}
  `.trim();
}