import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current version
    let config = await base44.entities.SystemConfig.filter({ key: 'refresh_version' });
    const currentVersion = config.length > 0 ? parseInt(config[0].value) : 0;

    // Update or create with incremented version
    if (config.length > 0) {
      await base44.entities.SystemConfig.update(config[0].id, { value: String(currentVersion + 1) });
    } else {
      await base44.entities.SystemConfig.create({ key: 'refresh_version', value: '1' });
    }

    return Response.json({ success: true, newVersion: currentVersion + 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});