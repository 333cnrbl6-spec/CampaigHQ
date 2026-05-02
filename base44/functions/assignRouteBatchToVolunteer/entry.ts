import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      volunteer_email,
      volunteer_name,
      contact_ids,
      batch_number,
      target_date,
      notes = ''
    } = body;

    if (!volunteer_email || !contact_ids || contact_ids.length === 0) {
      return Response.json({ 
        error: 'Provide volunteer_email and contact_ids' 
      }, { status: 400 });
    }

    // Create a canvassing shift assignment record
    // (This would be a CanvassingShift entity, or you could create a new RouteBatch entity)
    const shiftData = {
      title: `Route Batch ${batch_number} — ${contact_ids.length} contacts`,
      date: target_date,
      start_time: '10:00',
      end_time: '16:00',
      location: 'Self-routed',
      team_lead: user.email,
      capacity: 1,
      description: notes || `${contact_ids.length} pre-optimized contacts in efficient order.`,
      status: 'scheduled',
      contacts_count: contact_ids.length
    };

    const shift = await base44.entities.CanvassingShift.create(shiftData);

    // Create signup record linking volunteer to shift
    const signupData = {
      shift_id: shift.id,
      volunteer_email,
      volunteer_name,
      status: 'confirmed',
      notes: `Assigned ${contact_ids.length} contacts in batch ${batch_number}`
    };

    const signup = await base44.entities.ShiftSignup.create(signupData);

    // Tag all contacts with the volunteer's email for tracking
    const allContacts = await base44.entities.Contact.list('name', 5000);
    const contactsToUpdate = allContacts.filter(c => contact_ids.includes(c.id));

    for (const contact of contactsToUpdate) {
      const currentTags = contact.tags || [];
      const updatedTags = [...new Set([...currentTags, `assigned-${volunteer_email.split('@')[0]}`])];
      await base44.entities.Contact.update(contact.id, { tags: updatedTags });
    }

    return Response.json({
      success: true,
      message: `Batch ${batch_number} assigned to ${volunteer_name}`,
      shift_id: shift.id,
      signup_id: signup.id,
      contacts_assigned: contact_ids.length
    });
  } catch (error) {
    console.error('Error assigning batch:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});