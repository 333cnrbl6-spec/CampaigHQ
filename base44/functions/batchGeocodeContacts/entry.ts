import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function geocodeByPostcode(postcode) {
  if (!postcode) return null;
  const pc = postcode.replace(/\s+/g, '').toUpperCase();
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return { latitude: data.result.latitude, longitude: data.result.longitude };
    }
  } catch (e) {
    console.error(`postcodes.io error for ${pc}:`, e.message);
  }
  return null;
}

async function geocodeByAddress(address, postcode) {
  const query = [address, postcode, 'UK'].filter(Boolean).join(', ');
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=gb`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CampaignCanvassingApp/1.0' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error(`Nominatim error for "${query}":`, e.message);
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch contacts that need geocoding — include latitude=0 sentinel so they get retried with Nominatim
    const allContacts = await base44.asServiceRole.entities.Contact.list('name', 5000);
    const needsGeocoding = allContacts.filter(c =>
      (!c.latitude || c.latitude === 0 || !c.longitude) && (c.postcode || c.address)
    );

    const BATCH = 40;
    const toProcess = needsGeocoding.slice(0, BATCH);
    const totalRemaining = needsGeocoding.length;

    console.log(`Processing ${toProcess.length} of ${totalRemaining} remaining contacts...`);

    const results = {
      total_remaining_before: totalRemaining,
      processed: toProcess.length,
      succeeded: 0,
      failed: 0,
      used_nominatim: 0,
      more_remaining: totalRemaining > BATCH,
    };

    // Process in parallel groups of 5
    const GROUP = 5;
    for (let i = 0; i < toProcess.length; i += GROUP) {
      const group = toProcess.slice(i, i + GROUP);

      await Promise.all(group.map(async (contact) => {
        try {
          // 1. Try postcodes.io with postcode field
          let coords = contact.postcode ? await geocodeByPostcode(contact.postcode) : null;

          // 2. Try postcodes.io with postcode extracted from address
          if (!coords && contact.address) {
            const match = contact.address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
            if (match) coords = await geocodeByPostcode(match[1]);
          }

          // 3. Fall back to Nominatim full address geocoding
          if (!coords && (contact.address || contact.postcode)) {
            coords = await geocodeByAddress(contact.address, contact.postcode);
            if (coords) results.used_nominatim += 1;
          }

          if (coords) {
            await base44.asServiceRole.entities.Contact.update(contact.id, {
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            results.succeeded += 1;
          } else {
            // Mark as permanently failed so we don't keep retrying
            await base44.asServiceRole.entities.Contact.update(contact.id, { latitude: 0, longitude: 0 });
            results.failed += 1;
          }
        } catch (error) {
          results.failed += 1;
          console.error(`Error processing ${contact.name}:`, error.message);
        }
      }));

      // Pause between groups to respect Nominatim rate limit (1 req/sec)
      if (i + GROUP < toProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }

    return Response.json({
      success: true,
      message: `Geocoded ${results.succeeded} (${results.used_nominatim} via Nominatim). ${results.more_remaining ? `${totalRemaining - toProcess.length} still remaining.` : 'All done!'}`,
      results,
    });
  } catch (error) {
    console.error('Error in batch geocoding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});