import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_urls } = await req.json();
    if (!file_urls || !Array.isArray(file_urls)) {
      return Response.json({ error: 'file_urls array required' }, { status: 400 });
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
    let recordsProcessed = 0;
    const errors = [];

    // Process each file
    for (const fileUrl of file_urls) {
      try {
        // Extract data from the file
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
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
          errors.push(`File ${fileUrl}: extraction failed - ${extractRes.details}`);
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
          errors.push(`File ${fileUrl}: no data rows found`);
          continue;
        }

        // Get column names from first row
        const columnNames = Object.keys(rows[0] || {});
        
        // Find TYL column (first column with TYL in name)
        const tylCol = columnNames.find(c => c?.toUpperCase().includes('TYL'));
        const addressCol = columnNames[1]; // Second column is address
        const postcodeCol = columnNames[columnNames.length - 1]; // Last column is postcode

        if (!tylCol || !addressCol) {
          errors.push(`File ${fileUrl}: could not identify TYL or address columns`);
          continue;
        }

        // Process each row (skip header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const tylCode = (row[tylCol] || '').trim();
          const address = (row[addressCol] || '').trim();
          const postcode = (row[postcodeCol] || '').trim();

          // Skip if no TYL or address
          if (!tylCode || !address) continue;

          recordsProcessed++;

          // Normalize postcode for matching
          const normalizedPostcode = postcode.replace(/\s/g, '').toUpperCase();

          // Try to find matching contact
          let matchedContact = null;

          // First try: postcode + address
          if (normalizedPostcode && contactsByPostcode[normalizedPostcode]) {
            const candidates = contactsByPostcode[normalizedPostcode];
            matchedContact = candidates.find(c => 
              c.address?.toLowerCase().includes(address.toLowerCase())
            );
          }

          // Second try: postcode alone
          if (!matchedContact && normalizedPostcode && contactsByPostcode[normalizedPostcode]) {
            matchedContact = contactsByPostcode[normalizedPostcode][0];
          }

          // Third try: address alone
          if (!matchedContact) {
            const normalizedAddress = address.toLowerCase().trim();
            if (contactsByAddress[normalizedAddress]) {
              matchedContact = contactsByAddress[normalizedAddress][0];
            }
          }

          // Add tag if matched
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
        errors.push(`File ${fileUrl}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      files_processed: file_urls.length,
      records_processed: recordsProcessed,
      total_tags_added: totalTagsAdded,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});