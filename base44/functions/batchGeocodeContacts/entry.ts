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

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all contacts, find those still needing geocoding.
    // latitude=0 sentinel means "permanently failed with no postcode" — skip those.
    const allContacts = await base44.asServiceRole.entities.Contact.list('name', 5000);
    const needsGeocoding = allContacts.filter(c => {
      const hasCoords = c.latitude != null && c.latitude !== 0 && c.longitude != null && c.longitude !== 0;
      if (hasCoords) return false;
      const alreadyFailed = c.latitude === 0;
      if (alreadyFailed && !c.postcode?.trim()) return false; // no postcode — already marked as failed, skip
      return !!(c.postcode?.trim() || c.address?.trim());
    });

    // Process up to 100 per call using the bulk postcodes.io endpoint
    const BATCH = 100;
    const toProcess = needsGeocoding.slice(0, BATCH);
    const totalRemaining = needsGeocoding.length;

    console.log(`Processing ${toProcess.length} of ${totalRemaining} remaining contacts...`);

    const results = {
      total_remaining_before: totalRemaining,
      processed: toProcess.length,
      succeeded: 0,
      failed: 0,
      more_remaining: totalRemaining > BATCH,
    };

    if (toProcess.length === 0) {
      return Response.json({ success: true, message: 'All done — nothing to geocode.', results });
    }

    // Step 1: collect unique postcodes (normalised), including those extractable from address
    const contactPostcodes = toProcess.map(c => {
      if (c.postcode?.trim()) return c.postcode.replace(/\s+/g, '').toUpperCase();
      const match = (c.address || '').match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
      return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
    });

    const uniquePostcodes = [...new Set(contactPostcodes.filter(Boolean))];

    // Step 2: bulk lookup (max 100 per call — already within limit)
    const postcodeMap = uniquePostcodes.length > 0 ? await bulkGeocodePostcodes(uniquePostcodes) : {};

    // Step 3: update contacts in small sequential batches to avoid rate limiting
    const WRITE_BATCH = 5;
    for (let i = 0; i < toProcess.length; i += WRITE_BATCH) {
      const chunk = toProcess.slice(i, i + WRITE_BATCH);
      await Promise.all(chunk.map(async (contact, j) => {
        const pc = contactPostcodes[i + j];
        const coords = pc ? postcodeMap[pc] : null;
        if (coords) {
          await base44.asServiceRole.entities.Contact.update(contact.id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
          results.succeeded += 1;
        } else {
          await base44.asServiceRole.entities.Contact.update(contact.id, { latitude: 0, longitude: 0 });
          results.failed += 1;
        }
      }));
      if (i + WRITE_BATCH < toProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return Response.json({
      success: true,
      message: `Geocoded ${results.succeeded} contacts. ${results.more_remaining ? `${totalRemaining - toProcess.length} still remaining.` : 'All done!'}`,
      results,
    });
  } catch (error) {
    console.error('Error in batch geocoding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});