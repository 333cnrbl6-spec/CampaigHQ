import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, campaign_id, old_values, new_values, details } = await req.json();

    // Get IP and user agent from headers
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-client-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Create audit log
    const auditLog = {
      campaign_id: campaign_id || '',
      user_email: user.email,
      action,
      entity_type,
      entity_id: entity_id || '',
      old_values: old_values || {},
      new_values: new_values || {},
      ip_address,
      user_agent,
      status: 'success',
      notes: details || '',
    };

    await base44.asServiceRole.entities.AuditLog.create(auditLog);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});