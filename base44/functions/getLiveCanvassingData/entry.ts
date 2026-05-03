import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id required' }, { status: 400 });
    }

    // Get active volunteer locations (last updated within 10 minutes)
    const volunteers = await base44.asServiceRole.entities.VolunteerLocation.filter({
      status: { $in: ['active', 'idle'] }
    });

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const activeVolunteers = volunteers.filter(v => v.last_updated > tenMinutesAgo);

    // Get volunteer profiles for contact info
    const profiles = await base44.asServiceRole.entities.VolunteerProfile.list();

    // Get all turfs for this campaign with completion status
    const turfs = await base44.asServiceRole.entities.Turf.filter({ campaign_id });

    // Get canvassing sessions to track completion
    const sessions = await base44.asServiceRole.entities.CanvassingLog.filter({ campaign_id });

    // Organize sessions by turf
    const turfProgress = {};
    turfs.forEach(turf => {
      const turfSessions = sessions.filter(s => s.turf_id === turf.id);
      const totalDoors = turf.target_doors || turf.contact_count || 0;
      const doorsKnocked = turfSessions.reduce((sum, s) => sum + (s.doors_knocked || 0), 0);
      
      turfProgress[turf.id] = {
        turf_id: turf.id,
        turf_name: turf.name,
        status: turf.status,
        priority: turf.priority,
        geojson: turf.geojson,
        color: turf.color,
        target_doors: totalDoors,
        doors_knocked: doorsKnocked,
        completion_percentage: totalDoors > 0 ? Math.round((doorsKnocked / totalDoors) * 100) : 0,
        assigned_to: turf.assigned_to,
        volunteers_assigned: turf.assigned_team || [],
      };
    });

    // Enrich volunteer data with profile info
    const enrichedVolunteers = activeVolunteers.map(vol => {
      const profile = profiles.find(p => p.user_email === vol.volunteer_email);
      const turfData = turfProgress[vol.turf_id];

      return {
        id: vol.volunteer_email,
        name: vol.volunteer_name,
        email: vol.volunteer_email,
        latitude: vol.latitude,
        longitude: vol.longitude,
        postcode: vol.postcode,
        status: vol.status,
        doors_knocked_today: vol.doors_knocked_today || 0,
        current_contact_id: vol.current_contact_id,
        battery_level: vol.battery_level || 100,
        turf_id: vol.turf_id,
        turf_name: vol.turf_name,
        team_lead: profile?.team_lead_email || 'Unassigned',
        last_updated: vol.last_updated,
      };
    });

    // Calculate campaign-wide metrics
    const totalTurfs = turfs.length;
    const completedTurfs = Object.values(turfProgress).filter(t => t.completion_percentage === 100).length;
    const inProgressTurfs = Object.values(turfProgress).filter(t => t.completion_percentage > 0 && t.completion_percentage < 100).length;
    const totalDoorsKnocked = Object.values(turfProgress).reduce((sum, t) => sum + t.doors_knocked, 0);

    return Response.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      campaign_metrics: {
        total_turfs: totalTurfs,
        completed_turfs: completedTurfs,
        in_progress_turfs: inProgressTurfs,
        not_started_turfs: totalTurfs - completedTurfs - inProgressTurfs,
        total_doors_knocked: totalDoorsKnocked,
      },
      active_volunteers: enrichedVolunteers,
      turf_progress: Object.values(turfProgress),
      volunteer_count: enrichedVolunteers.length,
    });
  } catch (error) {
    console.error('Error fetching live canvassing data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});