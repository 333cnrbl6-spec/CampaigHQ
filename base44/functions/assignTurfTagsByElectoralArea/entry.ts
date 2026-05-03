import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch contacts and turfs for this campaign
    const [contacts, turfs] = await Promise.all([
      base44.asServiceRole.entities.Contact.filter({ campaign_id }, 'name', 10000),
      base44.asServiceRole.entities.Turf.filter({ campaign_id }, 'name', 1000)
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
    
    let lookupErrors = 0;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    for (let idx = 0; idx < contacts.length; idx++) {
      const contact = contacts[idx];
      let electoralArea = null;
      
      if (contact.postcode) {
        try {
          const postcodeClean = contact.postcode.replace(/\s+/g, '');
          const response = await fetch(`https://api.postcodes.io/postcodes/${postcodeClean}`);
          
          if (response.ok) {
            const data = await response.json();
            // Extract administrative ward or county code
            const ward = data.result?.admin_ward || data.result?.admin_district || '';
            
            if (ward) {
              const numMatch = ward.match(/(\d+)/);
              if (numMatch) {
                electoralArea = 'TYL' + numMatch[1];
              }
            }
          } else if (response.status === 429) {
            // Rate limited — back off exponentially
            await delay(1000);
          }
        } catch (err) {
          lookupErrors++;
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

      // Rate limit postcodes.io lookups: pause every 5 contacts
      if ((idx + 1) % 5 === 0) {
        await delay(300);
      }
    }

    // Batch update all contacts with error handling
    let updated = 0;
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      try {
        await base44.asServiceRole.entities.Contact.update(update.id, { tags: update.tags });
        updated++;
      } catch (err) {
        console.error(`Failed to update contact ${update.id}:`, err.message);
        lookupErrors++;
      }
      // Pause every 3 updates to stay within rate limits
      if ((i + 1) % 3 === 0) {
        await delay(200);
      }
    }

    return Response.json({
      success: true,
      total_contacts: contacts.length,
      updated: updated,
      lookup_errors: lookupErrors,
      turf_mappings: turfMap,
      message: `Successfully assigned turf tags to ${updated} contacts`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});