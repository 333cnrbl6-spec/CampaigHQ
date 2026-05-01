import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all contacts and turfs
    const [contacts, turfs] = await Promise.all([
      base44.entities.Contact.list('name', 10000),
      base44.entities.Turf.list('name', 1000)
    ]);

    // Build turf name map from TYL codes
    // Extract numeric suffixes from turf names to create TYL -> name mapping
    const turfMap = {};
    turfs.forEach(t => {
      const match = t.name.match(/TYL(\d+)/i);
      if (match) {
        const code = 'TYL' + match[1];
        turfMap[code.toUpperCase()] = t.name;
      }
    });

    // Update contacts with turf tags based on electoral area
    const updates = [];
    
    // If no turfs with TYL codes exist, skip tagging
    if (Object.keys(turfMap).length === 0) {
      return Response.json({
        success: true,
        total_contacts: contacts.length,
        updated: 0,
        turf_mappings: turfMap,
        message: 'No turfs with TYL codes found. Create turfs with TYL names first (e.g. "TYL1", "TYL2").'
      });
    }
    
    for (const contact of contacts) {
      // Extract electoral area from postcode using postcodes.io
      let electoralArea = null;
      
      if (contact.postcode) {
        try {
          const postcodeClean = contact.postcode.replace(/\s+/g, '');
          const response = await fetch(`https://api.postcodes.io/postcodes/${postcodeClean}`);
          
          if (response.ok) {
            const data = await response.json();
            // Extract administrative ward or county code
            // postcodes.io returns ward, district, region, etc. Use first available
            const ward = data.result?.admin_ward || data.result?.admin_district || '';
            
            if (ward) {
              // Try simple numeric extraction: if ward contains numbers, use those
              // Or match against known TYL codes if available
              const numMatch = ward.match(/(\d+)/);
              if (numMatch) {
                electoralArea = 'TYL' + numMatch[1];
              }
            }
          }
        } catch (err) {
          // Silently skip if postcodes.io fails
        }
      }

      if (electoralArea && turfMap[electoralArea]) {
        const turfName = turfMap[electoralArea];
        const currentTags = contact.tags || [];
        
        // Only update if turf tag not already present
        if (!currentTags.includes(turfName)) {
          currentTags.push(turfName);
          updates.push({
            id: contact.id,
            tags: currentTags
          });
        }
      }
    }

    // Batch update all contacts
    let updated = 0;
    for (const update of updates) {
      await base44.entities.Contact.update(update.id, { tags: update.tags });
      updated++;
    }

    return Response.json({
      success: true,
      total_contacts: contacts.length,
      updated: updated,
      turf_mappings: turfMap,
      message: `Successfully assigned turf tags to ${updated} contacts`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});