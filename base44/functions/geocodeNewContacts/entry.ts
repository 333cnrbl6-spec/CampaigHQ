import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Postcode to coordinates lookup (free, no API key required)
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
    const body = await req.json();
    const { contact_id, postcode, address } = body;

    if (!contact_id) {
      return Response.json({ error: 'contact_id required' }, { status: 400 });
    }

    // Try to geocode using postcode first (most reliable)
    let coords = null;
    if (postcode) {
      coords = await geocodePostcode(postcode);
    }

    // If postcode geocoding fails, try extracting postcode from address
    if (!coords && address) {
      const postcodeMatch = address.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i);
      if (postcodeMatch) {
        coords = await geocodePostcode(postcodeMatch[1]);
      }
    }

    if (coords) {
      // Update contact with coordinates
      await base44.entities.Contact.update(contact_id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        postcode: coords.postcode,
      });

      return Response.json({
        success: true,
        message: 'Contact geocoded successfully',
        coords,
      });
    }

    return Response.json({
      success: false,
      message: 'Could not geocode contact - no valid postcode or address found',
      contact_id,
    });
  } catch (error) {
    console.error('Error geocoding contact:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});