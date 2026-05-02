import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, user_email } = await req.json();

    if (!campaign_id || !user_email) {
      return Response.json(
        { error: 'Missing campaign_id or user_email' },
        { status: 400 }
      );
    }

    // Fetch user's volunteer profile
    const profiles = await base44.entities.VolunteerProfile.filter({
      user_email: user_email
    });
    const profile = profiles[0] || null;

    // Fetch canvassing logs
    const logs = await base44.entities.CanvassingLog.filter({
      volunteer_email: user_email,
      campaign_id: campaign_id
    });

    // Fetch interactions logged by user
    const interactions = await base44.entities.ContactInteraction.filter({
      logged_by: user_email
    });

    // Fetch location history
    const locations = await base44.entities.VolunteerLocation.filter({
      volunteer_email: user_email
    });

    // Compile report
    const report = {
      volunteer_profile: profile,
      canvassing_logs: logs || [],
      interactions: interactions || [],
      location_history: locations || [],
      exported_at: new Date().toISOString(),
      retention_policy: 'Data retained for campaign duration + 1 year for audit purposes'
    };

    // Log GDPR request
    await base44.entities.GdprRequest.create({
      request_type: 'data_access',
      contact_id: user_email,
      contact_name: profile?.full_name || user_email,
      contact_email: user_email,
      requested_by: user.email,
      status: 'completed',
      notes: `Data access report generated: ${Object.keys(report).length} sections exported`
    });

    // Log audit event
    await base44.entities.AuditLog.create({
      campaign_id: campaign_id,
      user_email: user.email,
      action: 'export',
      entity_type: 'gdpr_data_access',
      entity_id: user_email,
      status: 'success',
      notes: `Data access report generated for ${user_email}`
    });

    return Response.json({
      success: true,
      data: report
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});