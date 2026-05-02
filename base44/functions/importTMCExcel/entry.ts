import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, campaign_id } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Extract raw data from XLSX
    const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: file_url,
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
      return Response.json({ error: 'Failed to extract file', details: extractRes.details }, { status: 400 });
    }

    // Get raw data—could be array or object
    let rows = [];
    const output = extractRes.output;
    
    if (Array.isArray(output)) {
      rows = output;
    } else if (output?.rows && Array.isArray(output.rows)) {
      rows = output.rows;
    } else if (typeof output === 'object') {
      // Might be a single record, wrap it
      rows = [output];
    }
    
    // Filter out non-object entries
    rows = rows.filter(r => typeof r === 'object' && r !== null);

    if (rows.length === 0) {
      return Response.json({ error: 'No records found in file' }, { status: 400 });
    }

    // Map columns: assume first col is zone, second is address, last is postcode
    const columnNames = Object.keys(rows[0] || {});
    const zoneCol = columnNames[0]; // TYL1
    const addressCol = columnNames[1]; // Street address
    const postcodeCol = columnNames[columnNames.length - 1]; // Postcode

    const contactRecords = rows
      .filter(r => r[addressCol] && r[postcodeCol])
      .map(r => ({
        name: r[addressCol] || '',
        address: r[addressCol] || '',
        postcode: (r[postcodeCol] || '').replace(/\xa0/g, ' ').trim(),
        tags: r[zoneCol] ? [r[zoneCol]] : []
      }));

    if (contactRecords.length === 0) {
      return Response.json({ error: 'No valid records to import' }, { status: 400 });
    }

    // Bulk create with campaign_id injected
    const contactsWithCampaign = contactRecords.map(r => ({ ...r, campaign_id }));
    const created = await base44.entities.Contact.bulkCreate(contactsWithCampaign);

    return Response.json({
      success: true,
      imported: created.length,
      message: `Imported ${created.length} contacts with TYL zone tags`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});