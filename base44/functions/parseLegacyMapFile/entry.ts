import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseFilename(filename) {
  const clean = filename.replace(/^[a-f0-9]+_/i, '').replace(/\.docx?$/i, '');
  const match = clean.match(/^([A-Z]+)(\d+)[_-]?R(\d+)[_-](\d+)$/i);
  if (match) {
    const area = match[1].toUpperCase();
    const turfNum = match[2];
    const routeNum = match[3];
    const households = parseInt(match[4]);
    const areaMap = { TYL: 'Tyldesley', AST: 'Astley', MOS: 'Mosley Common' };
    const areaName = areaMap[area] || area;
    return { turf_name: `${areaName} ${turfNum}`, route_label: `R${routeNum}`, total_households: households, area: areaName };
  }
  return { turf_name: clean, route_label: '', total_households: 0, area: 'Tyldesley' };
}

// Parse streets from the plain-text/markdown content of a DOCX (already converted client-side)
function parseStreetsFromText(text) {
  const streets = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let inTable = false;

  for (const line of lines) {
    if (/road name|house number|households/i.test(line)) { inTable = true; continue; }
    if (/^[\|\-\+\s]+$/.test(line)) continue;

    if (inTable) {
      const cols = line.split('|').map(c => c.replace(/\*+/g, '').trim()).filter(Boolean);
      if (cols.length >= 2) {
        const streetName = cols[0];
        const houseRange = cols[1] || '';
        const numHH = parseInt(cols[2]) || 0;
        if (streetName.length > 2 && !/^[-|=]+$/.test(streetName)) {
          streets.push({ street_name: streetName, house_range: houseRange, num_households: numHH });
        }
      }
    }
  }
  return streets;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Accepts either pre-extracted text content OR file_url for mammoth conversion
    const { filename, text_content, streets: clientStreets, file_url } = await req.json();
    if (!filename) return Response.json({ error: 'filename is required' }, { status: 400 });

    const meta = parseFilename(filename);

    // If client sent pre-parsed streets, use those; otherwise parse from text
    let streets = [];
    if (clientStreets && Array.isArray(clientStreets) && clientStreets.length > 0) {
      streets = clientStreets;
    } else if (text_content) {
      streets = parseStreetsFromText(text_content);
    }

    // Create Turf record
    const turf = await base44.asServiceRole.entities.Turf.create({
      name: `${meta.turf_name} (${meta.route_label})`,
      notes: `Imported from legacy map file. ${meta.route_label} — ${meta.total_households} total households.`,
      status: 'unassigned',
      priority: 'normal',
      target_doors: meta.total_households,
      doors_knocked: 0,
      goal: `Leaflet drop — ${meta.total_households} addresses`,
      ...(file_url ? { file_url } : {}),
    });

    // Create LeafletRun records per street
    const leafletRuns = [];
    for (const street of streets) {
      if (!street.street_name) continue;
      const run = await base44.asServiceRole.entities.LeafletRun.create({
        street_name: street.street_name,
        area: meta.area,
        total_houses: street.num_households || 0,
        leaflets_delivered: 0,
        status: 'not_started',
        notes: street.house_range ? `Houses: ${street.house_range}` : '',
      });
      leafletRuns.push(run);
    }

    return Response.json({
      success: true,
      turf_created: turf,
      leaflet_runs_created: leafletRuns.length,
      streets_imported: streets.length,
      meta: { ...meta },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});