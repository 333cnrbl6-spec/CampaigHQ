import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, file_urls } = await req.json();
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }
    if (!file_urls || !Array.isArray(file_urls)) {
      return Response.json({ error: 'file_urls array required' }, { status: 400 });
    }

    // Get all contacts for this campaign
    const allContacts = await base44.asServiceRole.entities.Contact.filter({ campaign_id }, 'name', 10000);
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
        // Extract data from the file - expect array of objects
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: {
            type: 'array',
            items: { type: 'object' }
          }
        });

        if (extractRes.status !== 'success') {
          errors.push(`File ${fileUrl}: extraction failed - ${extractRes.details}`);
          continue;
        }

        // Parse extracted data - handle ExtractDataFromUploadedFile output format
        let rows = [];
        const output = extractRes.output || {};
        
        // The output is an array returned as { 0: {...}, 1: {...}, ... }
        const outputKeys = Object.keys(output);
        if (outputKeys.length === 0) {
          errors.push(`File ${fileUrl}: empty output`);
          continue;
        }
        
        // Convert numeric-keyed object back to array (preserving order)
        if (outputKeys.every(k => /^\d+$/.test(k))) {
          // Sort by numeric index to preserve order
          const sortedKeys = outputKeys.sort((a, b) => parseInt(a) - parseInt(b));
          rows = sortedKeys.map(k => output[k]);
        } else {
          rows = Object.values(output);
        }

        // Filter out nulls but keep empty objects (they may be valid data rows)
        rows = rows.filter(r => r !== null && typeof r === 'object');

        if (rows.length === 0) {
          errors.push(`File ${fileUrl}: no usable data rows`);
          continue;
        }

        // Get column names from first non-empty row
        let columnNames = [];
        let firstDataRowIdx = 0;
        for (let i = 0; i < rows.length; i++) {
          const cols = Object.keys(rows[i]);
          if (cols.length > 0) {
            columnNames = cols;
            firstDataRowIdx = i;
            break;
          }
        }
        
        if (columnNames.length === 0) {
          errors.push(`File ${fileUrl}: could not find any column names`);
          continue;
        }
        
        // Find TYL column - could be labeled TYL, TYL1, TYL2, etc. or similar variations
        const tylCol = columnNames.find(c => {
          const upper = (c || '').toUpperCase();
          return upper.includes('TYL') || upper.includes('WARD') || upper.includes('ZONE');
        });
        
        // Address is typically the second column
        const addressCol = columnNames.length > 1 ? columnNames[1] : null;
        // Postcode is typically the last column
        const postcodeCol = columnNames[columnNames.length - 1];

        if (!tylCol) {
          errors.push(`File ${fileUrl}: could not identify TYL/WARD/ZONE column. Found: ${columnNames.join(', ')}`);
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