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

    // Filter to raster images only (EMF/WMF are Windows vector formats the LLM can't see)
    const rasterFiles = mediaFiles.filter(name => /\.(png|jpg|jpeg|gif|bmp)$/i.test(name));
    console.log('All media files:', mediaFiles.join(', '));
    console.log('Raster files:', rasterFiles.join(', '));

    const streetList = (streets || []).map(s => s.street_name).join(', ');

    // If no raster images, skip straight to street-name-only inference
    if (rasterFiles.length === 0) {
      console.log('No raster images found — using street-name inference only');
    }

    let imageUrl = null;

    if (rasterFiles.length > 0) {
      // Use the first raster image
      const imgFile = zip.files[rasterFiles[0]];
      const imgBytes = await imgFile.async('uint8array');
      const ext = rasterFiles[0].split('.').pop().toLowerCase();
      const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp' };
      const imageMimeType = mimeMap[ext] || 'image/png';

      // Upload the extracted image so the LLM can access it via URL
      const imgFileObj = new File([imgBytes], `map.${ext || 'png'}`, { type: imageMimeType });
      const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file: imgFileObj });
      imageUrl = uploadRes.file_url;
      console.log('Uploaded raster map image:', imageUrl);
    }

    const prompt = imageUrl
      ? `You are a GIS analyst. This image is a hand-drawn or printed map section of the Tyldesley & Mosley Common ward in Wigan, Greater Manchester, England (approximate centre: latitude 53.514, longitude -2.467).

The map section covers streets including: ${streetList || 'unknown streets'}.

Analyse the map image carefully and produce coordinate pairs that approximate the geographic boundary of the area shown. Look for visible street names, road layout, and overall area shape.

Rules:
- Ward centre: lat 53.514, lon -2.467. Tyldesley town centre: lat 53.5145, lon -2.4650
- Use the map image AND street names to estimate real-world coordinates
- Street blocks are typically 0.001-0.005 degrees apart
- Each point: lon first, then lat. Longitude ~-2.4 to -2.5, latitude ~53.50 to 53.53
- Produce 4-8 corner points tracing the outer boundary. DO NOT close the ring.

Return an object with a "points" array where each element has "lon" and "lat" number fields.`
      : `You are a GIS analyst with deep knowledge of Tyldesley & Mosley Common ward in Wigan, Greater Manchester, England.

Using your knowledge of the area and the following street names, estimate the geographic boundary of the turf/leaflet-route area that covers these streets: ${streetList || 'unknown streets'}.

Rules:
- Ward centre: lat 53.514, lon -2.467. Tyldesley town centre: lat 53.5145, lon -2.4650
- Longitude ~-2.4 to -2.5, latitude ~53.50 to 53.53
- Street blocks are typically 0.001-0.005 degrees apart
- Produce 4-8 corner points forming a polygon enclosing the named streets. DO NOT close the ring.

Return an object with a "points" array where each element has "lon" and "lat" number fields.`;

    const llmOptions = {
      model: imageUrl ? 'gemini_3_1_pro' : 'claude_sonnet_4_6',
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                lon: { type: 'number' },
                lat: { type: 'number' },
              },
              required: ['lon', 'lat'],
            },
          },
        },
        required: ['points'],
      },
    };

    if (imageUrl) llmOptions.file_urls = [imageUrl];

    let llmResult;
    try {
      llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM(llmOptions);
    } catch (llmErr) {
      console.log('LLM error:', llmErr.message);
      return Response.json({ error: 'LLM call failed: ' + llmErr.message, geojson: null });
    }
    console.log('LLM result:', JSON.stringify(llmResult));

    // Validate we have at least 3 points
    const points = llmResult?.points;
    if (!points || points.length < 3) {
      return Response.json({ error: 'LLM did not return enough coordinate points', geojson: null });
    }

    // Build a closed ring
    const ring = points.map(p => [p.lon, p.lat]);
    ring.push(ring[0]); // close the polygon

    const geojson = JSON.stringify({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {},
    });

    // If turf_id provided, update the Turf record
    if (turf_id) {
      await base44.asServiceRole.entities.Turf.update(turf_id, { geojson });
    }

    return Response.json({ success: true, geojson, image_url: imageUrl });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});