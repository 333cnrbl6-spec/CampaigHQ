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

// Google Geocoding API fallback for addresses without valid postcodes
async function geocodeAddressGoogle(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${Deno.env.get('GOOGLE_MAPS_API_KEY')}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    return null;
  } catch (e) {
    console.error('Google Geocoding fallback error:', e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    // Campaign_id required for non-admins
    if (!campaign_id && user.role !== 'admin') {
      return Response.json({ error: 'campaign_id required for non-admin users' }, { status: 400 });
    }

    // Fetch contacts needing geocoding, filtered by campaign if provided
    const allContacts = campaign_id
      ? await base44.asServiceRole.entities.Contact.filter({ campaign_id }, 'name', 5000)
      : await base44.asServiceRole.entities.Contact.list('name', 5000);
    const needsGeocoding = allContacts.filter(c => {
      const hasCoords = c.latitude != null && c.latitude !== 0 && c.longitude != null && c.longitude !== 0;
      if (hasCoords) return false;
      const alreadyFailed = c.latitude === 0;
      if (alreadyFailed && !c.postcode?.trim()) return false; // no postcode — already marked as failed, skip
      return !!(c.postcode?.trim() || c.address?.trim());
    });

    // Process all contacts in batches of 100
    const BATCH = 100;
    const totalNeeded = needsGeocoding.length;
    const results = {
      total_needed: totalNeeded,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    if (totalNeeded === 0) {
      return Response.json({ success: true, message: 'All done — nothing to geocode.', results });
    }

    console.log(`Geocoding ${totalNeeded} contacts in batches of ${BATCH}...`);

    // Process all contacts in batches
    for (let batchStart = 0; batchStart < totalNeeded; batchStart += BATCH) {
      const batchEnd = Math.min(batchStart + BATCH, totalNeeded);
      const toProcess = needsGeocoding.slice(batchStart, batchEnd);

      console.log(`Processing batch: ${batchStart + 1}–${batchEnd} of ${totalNeeded}...`);

      // Step 1: collect unique postcodes (normalised)
      const contactPostcodes = toProcess.map(c => {
        if (c.postcode?.trim()) return c.postcode.replace(/\s+/g, '').toUpperCase();
        const match = (c.address || '').match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
        return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
      });

      const uniquePostcodes = [...new Set(contactPostcodes.filter(Boolean))];

      // Step 2: bulk lookup postcodes
      const postcodeMap = uniquePostcodes.length > 0 ? await bulkGeocodePostcodes(uniquePostcodes) : {};

      // Step 3: update contacts one at a time with rate limiting
      for (let i = 0; i < toProcess.length; i++) {
        const contact = toProcess[i];
        const pc = contactPostcodes[i];
        let coords = pc ? postcodeMap[pc] : null;
        
        // Fallback to Google Geocoding if postcodes.io failed
        if (!coords && contact.address?.trim()) {
          coords = await geocodeAddressGoogle(contact.address);
        }
        
        try {
          if (coords) {
            await base44.asServiceRole.entities.Contact.update(contact.id, {
              latitude: coords.latitude,
              longitude: coords.longitude,
              postcode: coords.postcode || contact.postcode,
            });
            results.succeeded += 1;
          } else {
            await base44.asServiceRole.entities.Contact.update(contact.id, { latitude: 0, longitude: 0 });
            results.failed += 1;
          }
        } catch (err) {
          console.error(`Failed to update contact ${contact.id}:`, err.message);
          results.failed += 1;
        }

        results.processed += 1;

        // Small pause every 3 writes to stay within rate limits
        if ((i + 1) % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Pause between batches
      if (batchEnd < totalNeeded) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      message: `Geocoded ${results.succeeded} contacts successfully.`,
      results,
    });
  } catch (error) {
    console.error('Error in batch geocoding:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});