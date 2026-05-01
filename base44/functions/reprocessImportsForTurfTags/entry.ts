import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const fileUrl = body.file_url;

    if (!fileUrl) {
      return Response.json({ 
        files_processed: 0, 
        total_tags_added: 0,
        message: 'file_url parameter required' 
      });
    }

    // Fetch all current contacts
    const allContacts = await base44.entities.Contact.list('name', 10000);
    let totalTagsAdded = 0;

    try {
      // Extract data with AI, focusing on zone columns
      const extractRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all records from this file. Identify the first column as zone/turf codes (TYL1, TYL2, etc.). Map to:
- Col 1 → zone (TYL code)
- Col 2 → address
- Last col → postcode

Return ALL rows as JSON array with fields: zone, address, postcode.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  zone: { type: 'string' },
                  address: { type: 'string' },
                  postcode: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const extracted = extractRes?.records || [];
      let matched = 0;

      for (const rec of extracted) {
        if (!rec.zone) continue;

        // Match by address + postcode (most reliable)
        const match = allContacts.find(c => 
          c.address?.toLowerCase() === rec.address?.toLowerCase() &&
          c.postcode?.replace(/\s+/g, '') === rec.postcode?.replace(/\s+/g, '')
        );

        if (match) {
          const currentTags = match.tags || [];
          if (!currentTags.includes(rec.zone)) {
            const updatedTags = [...currentTags, rec.zone];
            await base44.entities.Contact.update(match.id, { tags: updatedTags });
            totalTagsAdded++;
            matched++;
          }
        }
      }
    } catch (err) {
      return Response.json({ 
        files_processed: 0,
        total_tags_added: 0,
        error: err.message 
      });
    }

    const results = [{ 
      tags_added: totalTagsAdded 
    }];

    return Response.json({
      files_processed: 1,
      total_tags_added: totalTagsAdded,
      details: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});