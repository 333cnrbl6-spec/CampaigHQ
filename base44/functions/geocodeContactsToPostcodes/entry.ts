import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactIds, turf } = await req.json();
    if (!contactIds?.length && !turf) {
      return Response.json({ error: 'Provide contactIds array or turf name' }, { status: 400 });
    }

    // Fetch contacts to geocode
    let contacts = [];
    if (contactIds?.length) {
      contacts = await Promise.all(
        contactIds.map(id => base44.entities.Contact.get(id))
      );
    } else if (turf) {
      // Fetch all contacts for the turf
      const allContacts = await base44.entities.Contact.list('', 1000);
      contacts = allContacts.filter(c => c.tags?.includes(turf) || c.address?.includes(turf));
    }

    const results = {
      total: contacts.length,
      updated: 0,
      failed: 0,
      errors: [],
      updated_ids: [],
    };

    // Geocode with rate limiting (Nominatim: 1 req/sec)
    for (const contact of contacts) {
      if (!contact.address) {
        results.failed++;
        results.errors.push({ id: contact.id, reason: 'No address' });
        continue;
      }

      try {
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1100));

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            contact.address + ', UK'
          )}&limit=1`,
          { headers: { 'User-Agent': 'Paul-Binns-Campaign' } }
        );

        const data = await response.json();
        if (!data || data.length === 0) {
          results.failed++;
          results.errors.push({ id: contact.id, reason: 'Address not found' });
          continue;
        }

        // Extract postcode from Nominatim response
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
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});