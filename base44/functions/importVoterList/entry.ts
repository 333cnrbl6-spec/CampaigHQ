import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i;

function extractPostcode(str) {
  if (!str) return null;
  const m = String(str).match(UK_POSTCODE_RE);
  return m ? m[1].toUpperCase().replace(/\s+/g, ' ').trim() : null;
}

function parseTurfZone(sheetName) {
  const match = sheetName.match(/^([A-Z0-9&*\s]+?)\s*[-–]/i);
  return match ? match[1].trim().replace(/\s+/g, '') : sheetName.trim();
}

function parseSheet(sheet, sheetName, isPostal) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const turf = parseTurfZone(sheetName);
  const addresses = [];

  for (const row of rows) {
    const raw = row[1];
    if (!raw) continue;
    const addr = String(raw).trim();
    if (!addr || addr.toUpperCase().startsWith('TYL') || addr.toUpperCase() === turf) continue;

    let postcode = null;
    for (let col = 2; col <= 5; col++) {
      if (row[col]) {
        postcode = extractPostcode(String(row[col]));
        if (postcode) break;
      }
    }
    if (!postcode) postcode = extractPostcode(addr);

    const tags = isPostal ? [turf, 'Postal Voter'] : [turf];
    addresses.push({ name: addr, address: addr, postcode: postcode || undefined, tags, registered_voter: isPostal });
  }
  return addresses;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { file_url, file_name, is_postal, campaign_id } = await req.json();
  if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });
  if (!campaign_id) return Response.json({ error: 'campaign_id is required' }, { status: 400 });

  // Download the file
  const fileRes = await fetch(file_url);
  if (!fileRes.ok) return Response.json({ error: 'Failed to fetch file' }, { status: 500 });
  const arrayBuffer = await fileRes.arrayBuffer();

  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  let allRecords = [];
  for (const name of workbook.SheetNames) {
    allRecords = allRecords.concat(parseSheet(workbook.Sheets[name], name, !!is_postal));
  }

  if (allRecords.length === 0) {
    return Response.json({ error: 'No records found in file' }, { status: 400 });
  }

  const BATCH_SIZE = 200;
  const createdIds = [];
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE).map(r => ({ ...r, campaign_id }));
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const created = await base44.asServiceRole.entities.Contact.bulkCreate(batch);
        createdIds.push(...(created || []).map(r => r.id));
        break;
      } catch (err) {
        if (attempt === 5) throw err;
        await delay(attempt * 1500);
      }
    }
  }

  await base44.asServiceRole.entities.ImportLog.create({
    file_name: file_name || 'voter-list.xlsx',
    entity_type: 'Contact',
    record_count: createdIds.length,
    status: 'completed',
    created_record_ids: createdIds,
    campaign_id,
  });

  return Response.json({ imported: createdIds.length, total: allRecords.length });
});