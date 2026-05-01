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

        // Parse extracted data - output is array returned as { 0: {...}, 1: {...}, ... }
        let rows = [];
        const output = extractRes.output || {};
        
        // Convert numeric-keyed object back to array
        const outputKeys = Object.keys(output);
        if (outputKeys.length === 0) {
          errors.push(`File ${fileUrl}: empty output`);
          continue;
        }
        
        // Check if output is numeric-indexed (from array)
        if (outputKeys.some(k => /^\d+$/.test(k))) {
          rows = Object.values(output);
        } else if (output?.rows && Array.isArray(output.rows)) {
          rows = output.rows;
        } else if (output?.rows && typeof output.rows === 'object') {
          // Columnar format: { rows: { TYL1: [...], address: [...] } }
          const cols = output.rows;
          const colNames = Object.keys(cols);
          if (colNames.length > 0 && Array.isArray(cols[colNames[0]])) {
            const rowCount = cols[colNames[0]].length;
            for (let i = 0; i < rowCount; i++) {
              const row = {};
              colNames.forEach(col => {
                row[col] = cols[col][i];
              });
              rows.push(row);
            }
          }
        }

        rows = rows.filter(r => typeof r === 'object' && r !== null && Object.keys(r).length > 0);

        // Get column names from first row
        const columnNames = Object.keys(rows[0] || {});
        
        // Find TYL column (first column with TYL in name)
        const tylCol = columnNames.find(c => c?.toUpperCase().includes('TYL'));
        // Address is second column, postcode is last column
        const addressCol = columnNames.length > 1 ? columnNames[1] : null;
        const postcodeCol = columnNames[columnNames.length - 1];

        if (!tylCol) {
          errors.push(`File ${fileUrl}: could not identify TYL column. Found columns: ${columnNames.join(', ')}`);
          continue;
        }
        if (!addressCol) {
          errors.push(`File ${fileUrl}: could not identify address column`);
          continue;
        }

        // Process each row (skip header if first row is all string labels)
        const startIdx = rows[0]?.[tylCol] === 'TYL1' || rows[0]?.[tylCol]?.includes('TYL') ? 1 : 0;
        
        for (let i = startIdx; i < rows.length; i++) {
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