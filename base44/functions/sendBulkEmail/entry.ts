import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { filters, subject, body } = await req.json();

    if (!subject || !body) return Response.json({ error: 'Subject and body required' }, { status: 400 });

    // Fetch all contacts server-side (up to 5000)
    let allContacts = await base44.asServiceRole.entities.Contact.list('-created_date', 5000);

    // Apply filters server-side
    if (filters) {
      const { support, voter, postcode } = filters;
      allContacts = allContacts.filter(c => {
        if (support && support !== 'all' && c.support_level !== support) return false;
        if (voter === 'registered' && !c.registered_voter) return false;
        if (voter === 'canvassed' && !c.canvassed) return false;
        if (voter === 'not_canvassed' && c.canvassed) return false;
        if (voter === 'volunteers' && !c.volunteer) return false;
        if (voter === 'has_email' && !c.email) return false;
        if (voter === 'has_phone' && !c.phone) return false;
        if (postcode && postcode !== 'all' && !(c.postcode || '').toUpperCase().startsWith(postcode)) return false;
        return true;
      });
    }

    const contactsWithEmail = allContacts.filter(c => c.email);
    if (contactsWithEmail.length === 0) {
      return Response.json({ error: 'No contacts with email addresses match the filters' }, { status: 400 });
    }

    const results = { sent: 0, failed: 0, skipped: allContacts.length - contactsWithEmail.length };

    for (const contact of contactsWithEmail) {
      const personalBody = body
        .replace(/\{\{name\}\}/g, contact.name || 'Resident')
        .replace(/\{\{postcode\}\}/g, contact.postcode || '')
        .replace(/\{\{address\}\}/g, contact.address || '');

      const personalSubject = subject
        .replace(/\{\{name\}\}/g, contact.name || 'Resident');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: contact.email,
        subject: personalSubject,
        body: personalBody,
        from_name: 'Paul Binns — Green Party',
      });

      results.sent++;
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});