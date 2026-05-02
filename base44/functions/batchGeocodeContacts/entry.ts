import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function geocodePostcode(postcode) {
  if (!postcode) return null;
  const pc = postcode.replace(/\s+/g, '').toUpperCase();
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 200 && data.result) {
      return {
        latitude: data.result.latitude,
        longitude: data.result.longitude,
        postcode: pc,
      };
    }
  } catch (error) {
    console.error(`Geocoding error for postcode ${pc}:`, error.message);
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

    // Fetch contacts that need geocoding (limit fetch to 5000, process first 50)
    const allContacts = await base44.asServiceRole.entities.Contact.list('name', 5000);
    const needsGeocoding = allContacts.filter(c =>
      (!c.latitude || !c.longitude) && (c.postcode || c.address)
    );

    const BATCH = 50; // smaller batch = faster response, avoids 502
    const toProcess = needsGeocoding.slice(0, BATCH);
    const totalRemaining = needsGeocoding.length;

    console.log(`Processing ${toProcess.length} of ${totalRemaining} remaining contacts...`);

    const results = {
      total_remaining_before: totalRemaining,
      processed: toProcess.length,
      succeeded: 0,
      failed: 0,
      more_remaining: totalRemaining > BATCH, // remaining AFTER this batch
    };

    // Process in small parallel groups of 5
    const GROUP = 5;
    for (let i = 0; i < toProcess.length; i += GROUP) {
      const group = toProcess.slice(i, i + GROUP);

      await Promise.all(group.map(async (contact) => {
        try {
          let coords = null;

          if (contact.postcode) {
            coords = await geocodePostcode(contact.postcode);
          }

          if (!coords && contact.address) {
            const match = contact.address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
            if (match) coords = await geocodePostcode(match[1]);
          }

          if (coords) {
            await base44.asServiceRole.entities.Contact.update(contact.id, {
              latitude: coords.latitude,
              longitude: coords.longitude,
              postcode: coords.postcode,
            });
            results.succeeded += 1;
          } else {
            results.failed += 1;
          }
        } catch (error) {
          results.failed += 1;
          console.error(`Error: ${contact.name}:`, error.message);
        }
      }));

      // Small pause between groups to avoid rate limiting
      if (i + GROUP < toProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return Response.json({
      success: true,
      message: `Geocoded ${results.succeeded}. ${results.more_remaining ? `${totalRemaining - toProcess.length} still remaining.` : 'All done!'}`,
      results,
    });
  } catch (error) {
    console.error('Error in batch geocoding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});