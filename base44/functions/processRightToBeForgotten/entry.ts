import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, contact_id } = await req.json();

    if (!campaign_id || !contact_id) {
      return Response.json(
        { error: 'Missing campaign_id or contact_id' },
        { status: 400 }
      );
    }

    // Get contact details
    const contact = await base44.entities.Contact.read(contact_id);
    
    if (!contact || contact.campaign_id !== campaign_id) {
      return Response.json(
        { error: 'Contact not found or does not belong to campaign' },
        { status: 404 }
      );
    }

    // Mark for deletion
    const deletionDate = new Date().toISOString().split('T')[0];
    await base44.entities.Contact.update(contact_id, {
      deletion_requested: true,
      deletion_requested_date: deletionDate
    });

    // Create GDPR request record
    await base44.entities.GdprRequest.create({
      request_type: 'right_to_be_forgotten',
      contact_id: contact_id,
      contact_name: contact.name,
      contact_email: contact.email,
      requested_by: user.email,
      status: 'pending',
      notes: `RTF request logged on ${deletionDate}. Auto-delete scheduled for 30 days.`
    });

    // Log audit event
    await base44.entities.AuditLog.create({
      campaign_id: campaign_id,
      user_email: user.email,
      action: 'gdpr_request',
      entity_type: 'contact',
      entity_id: contact_id,
      status: 'success',
      notes: `Right to be forgotten request processed for ${contact.name}`
    });

    return Response.json({
      success: true,
      message: 'Right to be forgotten request processed',
      deletion_scheduled: deletionDate
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});