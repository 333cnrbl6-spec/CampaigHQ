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

    // Accept a limit param so frontend can call in chunks
    let body = {};
    try { body = await req.json(); } catch {}
    const limit = body.limit || 150; // process up to 150 per call

    // Fetch all contacts that lack location data
    const allContacts = await base44.asServiceRole.entities.Contact.list('name', 5000);
    const needsGeocoding = allContacts.filter(c => 
      (!c.latitude || !c.longitude) && (c.postcode || c.address)
    );

    // Total remaining across ALL contacts (for progress reporting)
    const totalRemaining = needsGeocoding.length;

    // Only process up to `limit` this invocation
    const toProcess = needsGeocoding.slice(0, limit);

    console.log(`Batch geocoding ${toProcess.length} contacts (${totalRemaining} remaining total)...`);

    const results = {
      total_remaining_before: totalRemaining,
      processed: toProcess.length,
      succeeded: 0,
      failed: 0,
      more_remaining: totalRemaining > limit,
    };

    // Process in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);
      
      const geocodingPromises = batch.map(async (contact) => {
        try {
          let coords = null;

          if (contact.postcode) {
            coords = await geocodePostcode(contact.postcode);
          }

          if (!coords && contact.address) {
            const postcodeMatch = contact.address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
            if (postcodeMatch) {
              coords = await geocodePostcode(postcodeMatch[1]);
            }
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
          console.error(`Error processing ${contact.name}:`, error.message);
        }
      });

      await Promise.all(geocodingPromises);
      
      if (i + batchSize < toProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return Response.json({
      success: true,
      message: `Geocoded ${results.succeeded} contacts. ${results.more_remaining ? (totalRemaining - limit) + ' still remaining.' : 'All done!'}`,
      results,
    });
  } catch (error) {
    console.error('Error in batch geocoding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});