import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import mammoth from 'npm:mammoth@1.8.0';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, turf_id, streets } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Download the docx file
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });
    const arrayBuffer = await fileRes.arrayBuffer();

    // docx files are zip archives — extract images from word/media/
    const zip = await JSZip.loadAsync(arrayBuffer);
    const mediaFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('word/media/') && /\.(png|jpg|jpeg|gif|bmp|emf|wmf)$/i.test(name)
    );

    if (mediaFiles.length === 0) {
      return Response.json({ error: 'No map image found in document', geojson: null });
    }

    // Use the first (usually largest/only) image
    const imgFile = zip.files[mediaFiles[0]];
    const imgBytes = await imgFile.async('uint8array');
    const ext = mediaFiles[0].split('.').pop().toLowerCase();
    const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp' };
    const imageMimeType = mimeMap[ext] || 'image/png';

    // Upload the extracted image so the LLM can access it via URL
    const imgFileObj = new File([imgBytes], `map.${ext || 'png'}`, { type: imageMimeType });
    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file: imgFileObj });
    const imageUrl = uploadRes.file_url;

    // Use LLM vision to analyse the map image
    const streetList = (streets || []).map(s => s.street_name).join(', ');

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `You are a GIS analyst. This image is a hand-drawn or printed map section of the Tyldesley & Mosley Common ward in Wigan, Greater Manchester, England (approximate centre: latitude 53.514, longitude -2.467).

The map section covers streets including: ${streetList || 'unknown streets'}.

Your task: Analyse the map image carefully and produce a GeoJSON Polygon that approximates the geographic boundary of the area shown on this map. Look for visible street names, road layout, and area shape.

Rules:
- The ward centre is at lat 53.514, lon -2.467
- Tyldesley town centre is at approx lat 53.5145, lon -2.4650
- Use the visible map image and the street list to estimate real-world coordinates
- Street blocks are typically 0.001-0.005 degrees apart
- Return ONLY a valid GeoJSON Polygon geometry object (no Feature wrapper)
- Coordinates must be [longitude, latitude] pairs
- The polygon must close (first and last point identical)
- Produce 4-8 corner points tracing the boundary

Example format:
{"type":"Polygon","coordinates":[[[lon1,lat1],[lon2,lat2],[lon3,lat3],[lon4,lat4],[lon1,lat1]]]}`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          polygon: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              coordinates: {
                type: 'array',
                items: {
                  type: 'array',
                  items: { type: 'array', items: { type: 'number' } },
                },
              },
            },
          },
        },
        required: ['polygon'],
      },
    });

    // Validate it looks like a polygon
    const poly = llmResult?.polygon;
    if (!poly?.type || !poly?.coordinates) {
      return Response.json({ error: 'LLM did not return a valid GeoJSON polygon', geojson: null });
    }

    const geojson = JSON.stringify({ type: 'Feature', geometry: poly, properties: {} });

    // If turf_id provided, update the Turf record
    if (turf_id) {
      await base44.asServiceRole.entities.Turf.update(turf_id, { geojson });
    }

    return Response.json({ success: true, geojson, image_url: imageUrl });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});