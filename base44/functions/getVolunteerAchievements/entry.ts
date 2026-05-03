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

    // Fetch all canvassing sessions for this campaign
    const sessions = await base44.asServiceRole.entities.CanvassingLog.filter({ campaign_id });
    
    // Fetch volunteer profiles
    const profiles = await base44.asServiceRole.entities.VolunteerProfile.list();

    // Aggregate achievements by volunteer
    const volunteerStats = {};

    sessions.forEach(session => {
      const volunteerId = session.volunteer_email;
      
      if (!volunteerStats[volunteerId]) {
        const profile = profiles.find(p => p.user_email === volunteerId);
        volunteerStats[volunteerId] = {
          email: volunteerId,
          name: session.volunteer_name || profile?.full_name || 'Unknown',
          team_lead: profile?.team_lead_email || '',
          doors_knocked: 0,
          positive_responses: 0,
          negative_responses: 0,
          undecided_count: 0,
          leaflets_delivered: 0,
          sessions_count: 0,
          last_session: null,
        };
      }

      volunteerStats[volunteerId].doors_knocked += session.doors_knocked || 0;
      volunteerStats[volunteerId].positive_responses += session.positive_responses || 0;
      volunteerStats[volunteerId].negative_responses += session.negative_responses || 0;
      volunteerStats[volunteerId].undecided_count += session.undecided_count || 0;
      volunteerStats[volunteerId].leaflets_delivered += session.leaflets_delivered || 0;
      volunteerStats[volunteerId].sessions_count += 1;
      
      const sessionDate = new Date(session.session_date);
      if (!volunteerStats[volunteerId].last_session || sessionDate > new Date(volunteerStats[volunteerId].last_session)) {
        volunteerStats[volunteerId].last_session = session.session_date;
      }
    });

    // Calculate achievement badges and conversion rates
    const volunteersWithAchievements = Object.values(volunteerStats).map(vol => {
      const conversionRate = vol.doors_knocked > 0 
        ? Math.round((vol.positive_responses / vol.doors_knocked) * 100)
        : 0;

      const achievements = [];
      if (vol.doors_knocked >= 100) achievements.push({ name: 'Century', icon: '💯', description: '100+ doors knocked' });
      if (vol.doors_knocked >= 500) achievements.push({ name: 'Hall of Fame', icon: '🏆', description: '500+ doors knocked' });
      if (vol.positive_responses >= 50) achievements.push({ name: 'Persuader', icon: '🎯', description: '50+ positive responses' });
      if (vol.undecided_count >= 30) achievements.push({ name: 'Bridge Builder', icon: '🌉', description: '30+ undecided conversations' });
      if (vol.sessions_count >= 10) achievements.push({ name: 'Dedicated', icon: '⭐', description: '10+ canvassing sessions' });
      if (conversionRate >= 40) achievements.push({ name: 'Effective', icon: '✨', description: '40%+ conversion rate' });
      if (vol.leaflets_delivered >= 500) achievements.push({ name: 'Leaflet Champion', icon: '📋', description: '500+ leaflets delivered' });

      return {
        ...vol,
        conversion_rate: conversionRate,
        efficiency_score: Math.round((vol.positive_responses * 2 + vol.undecided_count) / Math.max(1, vol.sessions_count)),
        achievements,
      };
    });

    // Sort by doors knocked (primary metric)
    const sortedByDoors = [...volunteersWithAchievements].sort((a, b) => b.doors_knocked - a.doors_knocked);

    // Group by team lead for team leaderboard
    const teamStats = {};
    volunteersWithAchievements.forEach(vol => {
      const team = vol.team_lead || 'Unassigned';
      if (!teamStats[team]) {
        teamStats[team] = {
          team_lead: team,
          total_doors: 0,
          total_positive: 0,
          volunteer_count: 0,
          members: [],
        };
      }
      teamStats[team].total_doors += vol.doors_knocked;
      teamStats[team].total_positive += vol.positive_responses;
      teamStats[team].volunteer_count += 1;
      teamStats[team].members.push({
        name: vol.name,
        doors: vol.doors_knocked,
      });
    });

    const sortedTeams = Object.values(teamStats).sort((a, b) => b.total_doors - a.total_doors);

    return Response.json({
      status: 'success',
      individual_leaderboard: sortedByDoors,
      team_leaderboard: sortedTeams,
      total_volunteers: volunteersWithAchievements.length,
      total_doors_knocked: volunteersWithAchievements.reduce((sum, v) => sum + v.doors_knocked, 0),
      total_positive_responses: volunteersWithAchievements.reduce((sum, v) => sum + v.positive_responses, 0),
    });
  } catch (error) {
    console.error('Error calculating achievements:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});