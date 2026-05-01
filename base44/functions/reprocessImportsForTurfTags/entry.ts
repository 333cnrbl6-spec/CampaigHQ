import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent import logs (Contact entity imports)
    const importLogs = await base44.entities.ImportLog.filter(
      { entity_type: 'Contact' },
      '-created_date',
      20
    );

    if (importLogs.length === 0) {
      return Response.json({ message: 'No recent Contact imports found' });
    }

    // Fetch all current contacts for matching
    const allContacts = await base44.entities.Contact.list('name', 10000);

    let totalTagsAdded = 0;
    const results = [];

    // Process each recent import file
    for (const log of importLogs) {
      if (!log.file_url) continue;

      try {
        // Re-extract with focus on zone/turf/area columns
        const extractRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Re-extract all records from this Contact file, focusing on identifying any zone, turf, area, or region columns.
Map the following columns to their target fields:
- name → name
- address → address
- postcode → postcode
- email → email
- phone → phone
- zone/turf/area/region/electoral_area/ward → tags (as an array)
- any other zone-like field → tags

For zone/turf columns: if they have a value, put it in a tags array like ["Zone Name"] or ["TYL1"]. If empty, tags: [].

Return ALL records as a JSON array with name, address, postcode, and tags fields.`,
          file_urls: [log.file_url],
          response_json_schema: {
            type: 'object',
            properties: {
              records: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    postcode: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        });

        const extracted = extractRes?.records || [];

        // Match extracted records to existing contacts and add tags
        for (const rec of extracted) {
          if (!rec.tags || rec.tags.length === 0) continue;

          // Try to match by name + postcode, or name + address
          const match = allContacts.find(c => {
            const nameMatch = c.name?.toLowerCase() === rec.name?.toLowerCase();
            const postcodeMatch = c.postcode?.replace(/\s+/g, '') === rec.postcode?.replace(/\s+/g, '');
            const addressMatch = c.address?.toLowerCase() === rec.address?.toLowerCase();

            return nameMatch && (postcodeMatch || addressMatch);
          });

          if (match) {
            const currentTags = match.tags || [];
            const newTags = rec.tags.filter(t => t && !currentTags.includes(t));

            if (newTags.length > 0) {
              const updatedTags = [...currentTags, ...newTags];
              await base44.entities.Contact.update(match.id, { tags: updatedTags });
              totalTagsAdded += newTags.length;
            }
          }
        }

        results.push({
          file: log.file_name,
          records_extracted: extracted.length,
          records_matched: extracted.filter(r => allContacts.find(c => 
            c.name?.toLowerCase() === r.name?.toLowerCase()
          )).length
        });
      } catch (err) {
        results.push({
          file: log.file_name,
          error: err.message
        });
      }
    }

    return Response.json({
      success: true,
      files_processed: results.length,
      total_tags_added: totalTagsAdded,
      details: results,
      message: `Reprocessed ${results.length} recent imports and added ${totalTagsAdded} zone tags to existing contacts`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});