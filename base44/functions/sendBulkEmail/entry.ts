import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contacts, subject, body } = await req.json();

    if (!contacts?.length) return Response.json({ error: 'No contacts provided' }, { status: 400 });
    if (!subject || !body) return Response.json({ error: 'Subject and body required' }, { status: 400 });

    const contactsWithEmail = contacts.filter(c => c.email);
    if (contactsWithEmail.length === 0) {
      return Response.json({ error: 'No contacts with email addresses' }, { status: 400 });
    }

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const contact of contactsWithEmail) {
      // Personalise the message
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

    results.skipped = contacts.length - contactsWithEmail.length;

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});