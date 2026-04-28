import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get current refresh version
    const configs = await base44.asServiceRole.entities.SystemConfig.filter({ key: 'refresh_version' });
    const currentVersion = configs.length > 0 ? parseInt(configs[0].value || '0') : 0;
    const newVersion = currentVersion + 1;

    // Update or create the version
    if (configs.length > 0) {
      await base44.asServiceRole.entities.SystemConfig.update(configs[0].id, { value: String(newVersion) });
    } else {
      await base44.asServiceRole.entities.SystemConfig.create({ key: 'refresh_version', value: String(newVersion) });
    }

    return Response.json({ success: true, version: newVersion });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});