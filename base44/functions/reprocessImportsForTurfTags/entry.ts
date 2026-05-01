import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent import logs
    const importLogs = await base44.entities.ImportLog.list('-created_date', 20);
    const contactsWithUrls = importLogs.filter(log => log.file_url && log.entity_type === 'Contact');

    if (contactsWithUrls.length === 0) {
      return Response.json({ 
        success: true, 
        files_processed: 0, 
        total_tags_added: 0,
        message: 'No import files found to reprocess'
      });
    }

    // Get all contacts for matching
    const allContacts = await base44.entities.Contact.list('name', 10000);
    const contactsByPostcode = {};
    const contactsByAddress = {};
    
    allContacts.forEach(contact => {
      if (contact.postcode) {
        const normalized = (contact.postcode || '').replace(/\s/g, '').toUpperCase();
        if (!contactsByPostcode[normalized]) contactsByPostcode[normalized] = [];
        contactsByPostcode[normalized].push(contact);
      }
      if (contact.address) {
        const normalized = (contact.address || '').toLowerCase().trim();
        if (!contactsByAddress[normalized]) contactsByAddress[normalized] = [];
        contactsByAddress[normalized].push(contact);
      }
    });

    let totalTagsAdded = 0;
    const errors = [];

    // Process each import file
    for (const importLog of contactsWithUrls) {
      try {
        // Extract raw data from the file
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: importLog.file_url,
          json_schema: {
            type: 'object',
            properties: {
              rows: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
        });

        if (extractRes.status !== 'success') {
          errors.push(`File ${importLog.file_name}: extraction failed`);
          continue;
        }

        // Parse extracted data
        let rows = [];
        const output = extractRes.output;
        
        if (Array.isArray(output)) {
          rows = output;
        } else if (output?.rows && Array.isArray(output.rows)) {
          rows = output.rows;
        } else if (typeof output === 'object') {
          rows = [output];
        }

        rows = rows.filter(r => typeof r === 'object' && r !== null);

        if (rows.length === 0) {
          errors.push(`File ${importLog.file_name}: no data found`);
          continue;
        }

        // Get column names from first row
        const columnNames = Object.keys(rows[0] || {});
        
        // Identify columns: look for TYL, address (second col), and postcode (last col)
        const tylCol = columnNames.find(c => c?.toUpperCase().includes('TYL'));
        const addressCol = columnNames[1]; // Second column is address
        const postcodeCol = columnNames[columnNames.length - 1]; // Last column is postcode

        if (!tylCol) {
          errors.push(`File ${importLog.file_name}: no TYL column found`);
          continue;
        }

        // Process each row
        for (const row of rows) {
          const tylCode = row[tylCol];
          const address = row[addressCol];
          const postcode = row[postcodeCol];

          // Skip if no TYL or address
          if (!tylCode || !address) continue;

          // Normalize postcode for matching
          const normalizedPostcode = (postcode || '').replace(/\s/g, '').toUpperCase();

          // Try to find matching contact by postcode + address
          let matchedContact = null;

          if (normalizedPostcode && contactsByPostcode[normalizedPostcode]) {
            const candidates = contactsByPostcode[normalizedPostcode];
            matchedContact = candidates.find(c => 
              c.address?.toLowerCase().includes(address.toLowerCase())
            ) || candidates[0];
          }

          // If no match by postcode+address, try by address alone
          if (!matchedContact) {
            const normalizedAddress = address.toLowerCase().trim();
            if (contactsByAddress[normalizedAddress]) {
              matchedContact = contactsByAddress[normalizedAddress][0];
            }
          }

          // If we found a match, add the tag
          if (matchedContact) {
            const existingTags = matchedContact.tags || [];
            if (!existingTags.includes(tylCode)) {
              existingTags.push(tylCode);
              await base44.entities.Contact.update(matchedContact.id, { tags: existingTags });
              totalTagsAdded++;
            }
          }
        }
      } catch (error) {
        errors.push(`File ${importLog.file_name}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      files_processed: contactsWithUrls.length,
      total_tags_added: totalTagsAdded,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});