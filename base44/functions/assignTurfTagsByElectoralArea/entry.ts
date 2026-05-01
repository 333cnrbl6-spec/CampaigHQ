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
    for (const contact of contacts) {
      // Extract electoral area from postcode (first part before space/digit)
      // or check for electoral_area field if it exists
      let electoralArea = null;
      
      if (contact.postcode) {
        // Try to match TYL + number pattern from postcode
        const match = contact.postcode.match(/^(TYL\d+)/i);
        if (match) {
          electoralArea = match[1].toUpperCase();
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