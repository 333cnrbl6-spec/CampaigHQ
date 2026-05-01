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

    // Fetch all contacts that lack location data
    const allContacts = await base44.asServiceRole.entities.Contact.list('name', 5000);
    const needsGeocoding = allContacts.filter(c => 
      (!c.latitude || !c.longitude) && (c.postcode || c.address)
    );

    console.log(`Batch geocoding ${needsGeocoding.length} contacts...`);

    const results = {
      total: needsGeocoding.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      updated_ids: [],
    };

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < needsGeocoding.length; i += batchSize) {
      const batch = needsGeocoding.slice(i, i + batchSize);
      
      const geocodingPromises = batch.map(async (contact) => {
        try {
          let coords = null;

          // Try postcode first
          if (contact.postcode) {
            coords = await geocodePostcode(contact.postcode);
          }

          // If no postcode, try extracting from address
          if (!coords && contact.address) {
            const postcodeMatch = contact.address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
            if (postcodeMatch) {
              coords = await geocodePostcode(postcodeMatch[1]);
            }
          }

          if (coords) {
            // Update contact with coordinates
            await base44.asServiceRole.entities.Contact.update(contact.id, {
              latitude: coords.latitude,
              longitude: coords.longitude,
              postcode: coords.postcode,
            });

            results.succeeded += 1;
            results.updated_ids.push(contact.id);
            console.log(`✓ Geocoded ${contact.name}`);
          } else {
            results.failed += 1;
            console.log(`✗ Failed to geocode ${contact.name} - no valid postcode`);
          }
        } catch (error) {
          results.failed += 1;
          console.error(`Error processing ${contact.name}:`, error.message);
        }
      });

      await Promise.all(geocodingPromises);
      
      // Rate limiting pause between batches
      if (i + batchSize < needsGeocoding.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      message: `Batch geocoding complete: ${results.succeeded} updated, ${results.failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Error in batch geocoding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});