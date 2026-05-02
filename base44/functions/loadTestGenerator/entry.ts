import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, campaignId, volunteerCount = 100, logsPerVolunteer = 10 } = await req.json();

    if (action === 'generate_test_data') {
      // Create fake volunteers & canvassing logs
      const volunteersData = Array.from({ length: volunteerCount }, (_, i) => ({
        user_email: `test-volunteer-${i}@loadtest.local`,
        full_name: `Test Volunteer ${i}`,
        phone: `555-${String(i).padStart(4, '0')}`,
        location_tracking_consent: Math.random() > 0.5,
        setup_complete: true,
        gdpr_consent: true,
      }));

      // Batch create volunteers
      const volunteers = await base44.asServiceRole.entities.VolunteerProfile.bulkCreate(volunteersData);

      // Create canvassing logs for each volunteer
      const logsData = [];
      volunteers.forEach(vol => {
        for (let i = 0; i < logsPerVolunteer; i++) {
          logsData.push({
            campaign_id: campaignId,
            volunteer_name: vol.full_name,
            volunteer_email: vol.user_email,
            session_date: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString().split('T')[0],
            doors_knocked: Math.floor(Math.random() * 50) + 10,
            positive_responses: Math.floor(Math.random() * 20),
            negative_responses: Math.floor(Math.random() * 10),
            no_answers: Math.floor(Math.random() * 15),
            leaflets_delivered: Math.floor(Math.random() * 40) + 5,
            duration_minutes: Math.floor(Math.random() * 180) + 30,
            general_notes: `Load test session ${i}`,
          });
        }
      });

      await base44.asServiceRole.entities.CanvassingLog.bulkCreate(logsData);

      return Response.json({
        success: true,
        volunteersCreated: volunteers.length,
        logsCreated: logsData.length,
      });
    }

    if (action === 'cleanup_test_data') {
      // Delete all test volunteers
      const testVolunteers = await base44.asServiceRole.entities.VolunteerProfile.filter({
        user_email: { $regex: '^test-volunteer-' },
      }, '', 10000);

      for (const vol of testVolunteers) {
        await base44.asServiceRole.entities.VolunteerProfile.delete(vol.id);
      }

      return Response.json({
        success: true,
        volunteersDeleted: testVolunteers.length,
      });
    }

    if (action === 'stress_test') {
      // Simulate concurrent API calls
      const startTime = Date.now();
      const results = { success: 0, failed: 0, duration: 0, avgResponseTime: 0 };
      let totalResponseTime = 0;

      const testRequests = Array.from({ length: volunteerCount }, async (_, i) => {
        const reqStart = Date.now();
        try {
          // Simulate various API calls
          const endpoint = Math.floor(Math.random() * 4);
          if (endpoint === 0) {
            await base44.asServiceRole.entities.CanvassingLog.list('session_date', 1);
          } else if (endpoint === 1) {
            await base44.asServiceRole.entities.Contact.list('name', 1);
          } else if (endpoint === 2) {
            await base44.asServiceRole.entities.Turf.list('name', 1);
          } else {
            await base44.asServiceRole.entities.VolunteerProfile.list('full_name', 1);
          }
          results.success++;
          totalResponseTime += Date.now() - reqStart;
        } catch (error) {
          results.failed++;
        }
      });

      await Promise.all(testRequests);
      results.duration = Date.now() - startTime;
      results.avgResponseTime = totalResponseTime / volunteerCount;

      return Response.json({
        success: true,
        metrics: results,
        requestsPerSecond: (volunteerCount / (results.duration / 1000)).toFixed(2),
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});