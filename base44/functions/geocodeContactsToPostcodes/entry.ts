import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { campaign_id, contactIds, turf } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch contacts to geocode for this campaign
    let contacts = [];
    if (contactIds?.length) {
      const allContacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 10000);
      contacts = allContacts.filter(c => contactIds.includes(c.id));
    } else if (turf) {
      // Fetch all contacts for the turf in this campaign
      const allContacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 10000);
      contacts = allContacts.filter(c => c.tags?.includes(turf) || c.address?.includes(turf));
    } else {
      // Fetch all contacts without postcodes in this campaign
      const allContacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 10000);
      contacts = allContacts.filter(c => !c.postcode);
    }

    const results = {
      total: contacts.length,
      updated: 0,
      failed: 0,
      errors: [],
      updated_ids: [],
    };

    // Process in batches with concurrent requests (with backoff)
    const batchSize = 5;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (contact) => {
        if (!contact.address) {
          results.failed++;
          results.errors.push({ id: contact.id, reason: 'No address' });
          return;
        }

        try {
          // Stagger requests within batch
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              contact.address + ', Tyldesley, UK'
            )}&limit=1`,
            { headers: { 'User-Agent': 'Paul-Binns-Campaign' } }
          );

          const data = await response.json();
          if (!data || data.length === 0) {
            results.failed++;
            results.errors.push({ id: contact.id, reason: 'Address not found' });
            return;
          }

          const location = data[0];
          const postcodeMatch = location.address?.postcode;

          if (postcodeMatch) {
            await base44.entities.Contact.update(contact.id, { postcode: postcodeMatch });
            results.updated++;
            results.updated_ids.push(contact.id);
          } else {
            results.failed++;
            results.errors.push({ id: contact.id, reason: 'Postcode not in response' });
          }
        } catch (err) {
          results.failed++;
          results.errors.push({ id: contact.id, reason: err.message });
        }
      }));

      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});