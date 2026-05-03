import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// postcodes.io bulk endpoint — up to 100 postcodes per request
async function bulkGeocodePostcodes(postcodes) {
  try {
    const res = await fetch('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    for (const item of (data.result || [])) {
      if (item.result) {
        map[item.query.replace(/\s+/g, '').toUpperCase()] = {
          latitude: item.result.latitude,
          longitude: item.result.longitude,
          postcode: item.result.postcode,
        };
      }
    }
    return map;
  } catch (e) {
    console.error('postcodes.io bulk error:', e.message);
    return {};
  }
}

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
    const allContacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, '', 10000);
    let contacts = allContacts;
    if (contactIds?.length) {
      contacts = allContacts.filter(c => contactIds.includes(c.id));
    } else if (turf) {
      contacts = allContacts.filter(c => c.tags?.includes(turf) || c.address?.includes(turf));
    } else {
      // Only contacts missing coordinates or postcode
      contacts = allContacts.filter(c => {
        const hasCoords = c.latitude != null && c.latitude !== 0 && c.longitude != null && c.longitude !== 0;
        return !hasCoords || !c.postcode?.trim();
      });
    }

    const results = { total: contacts.length, updated: 0, failed: 0, errors: [], updated_ids: [] };

    if (contacts.length === 0) {
      return Response.json({ ...results, message: 'Nothing to geocode' });
    }

    // Collect postcodes (from postcode field or extracted from address)
    const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i;
    const contactPostcodes = contacts.map(c => {
      if (c.postcode?.trim()) return c.postcode.replace(/\s+/g, '').toUpperCase();
      const m = (c.address || '').match(UK_POSTCODE_RE);
      return m ? m[1].replace(/\s+/g, '').toUpperCase() : null;
    });

    const uniquePostcodes = [...new Set(contactPostcodes.filter(Boolean))];

    // Bulk geocode in batches of 100
    const BATCH = 100;
    const postcodeMap = {};
    for (let i = 0; i < uniquePostcodes.length; i += BATCH) {
      const chunk = uniquePostcodes.slice(i, i + BATCH);
      const chunkMap = await bulkGeocodePostcodes(chunk);
      Object.assign(postcodeMap, chunkMap);
      if (i + BATCH < uniquePostcodes.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Update contacts with coordinates and postcode
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const pc = contactPostcodes[i];
      const coords = pc ? postcodeMap[pc] : null;

      if (coords) {
        await base44.asServiceRole.entities.Contact.update(contact.id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          postcode: coords.postcode || contact.postcode,
        });
        results.updated++;
        results.updated_ids.push(contact.id);
      } else {
        results.failed++;
        results.errors.push({ id: contact.id, reason: pc ? 'Postcode not found in postcodes.io' : 'No postcode available' });
      }

      if ((i + 1) % 3 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`Geocoded ${results.updated}/${results.total} contacts for campaign ${campaign_id}`);
    return Response.json({ ...results, message: `Updated ${results.updated} of ${results.total} contacts` });
  } catch (error) {
    console.error('geocodeContactsToPostcodes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});