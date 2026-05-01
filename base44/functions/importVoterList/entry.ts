import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

const BATCH_SIZE = 200;

async function fetchFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function parseTurfCode(sheetName) {
  // Extract code from sheet name e.g. "TYL 1 - 835" → "TYL1", "T&MC - 5818" → "T&MC"
  const match = sheetName.match(/^([A-Z0-9&*\s]+?)\s*[-–]/i);
  return match ? match[1].trim().replace(/\s+/g, '') : sheetName.trim();
}

function parseSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const turf = parseTurfCode(sheetName);
  const contacts = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const addr = row[1];
    if (!addr) continue;
    const addrStr = String(addr).trim();
    if (!addrStr) continue;
    // Skip if it looks like the turf code header row
    if (addrStr.toUpperCase() === turf.toUpperCase()) continue;
    // Skip if it looks like a turf code itself (all caps short string matching pattern)
    if (/^(TYL|T&MC)\d*\*?$/i.test(addrStr)) continue;

    contacts.push({
      name: addrStr,
      address: addrStr,
      registered_voter: true,
      tags: [turf],
      support_level: 'unknown',
      canvassed: false,
    });
  }
  return contacts;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const data = await fetchFile(file_url);
    const workbook = XLSX.read(data, { type: 'array' });

    let allContacts = [];
    for (const sheetName of workbook.SheetNames) {
      const contacts = parseSheet(workbook, sheetName);
      allContacts = allContacts.concat(contacts);
    }

    // Import in batches with a small delay to avoid rate limiting
    let imported = 0;
    for (let i = 0; i < allContacts.length; i += BATCH_SIZE) {
      const batch = allContacts.slice(i, i + BATCH_SIZE);
      await base44.asServiceRole.entities.Contact.bulkCreate(batch);
      imported += batch.length;
      if (i + BATCH_SIZE < allContacts.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return Response.json({
      success: true,
      total: allContacts.length,
      imported,
      sheets: workbook.SheetNames.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});