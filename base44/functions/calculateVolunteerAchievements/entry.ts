import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all canvassing logs
    const logs = await base44.asServiceRole.entities.CanvassingLog.list('-session_date', 5000);

    // Group by volunteer and calculate stats
    const volunteerStats = {};

    logs.forEach(log => {
      const email = log.volunteer_email || 'unknown';
      if (!volunteerStats[email]) {
        volunteerStats[email] = {
          email,
          name: log.volunteer_name || 'Unknown',
          total_doors: 0,
          total_positive: 0,
          sessions: [],
          dates_canvassed: new Set(),
        };
      }

      volunteerStats[email].total_doors += log.doors_knocked || 0;
      volunteerStats[email].total_positive += log.positive_responses || 0;
      volunteerStats[email].sessions.push({
        date: log.session_date,
        doors: log.doors_knocked || 0,
        positive: log.positive_responses || 0,
      });
      volunteerStats[email].dates_canvassed.add(log.session_date);
    });

    // Calculate metrics and badges
    const volunteers = Object.values(volunteerStats).map(vol => {
      const sortedSessions = vol.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Calculate current streak
      let currentStreak = 0;
      let lastDate = null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const session of sortedSessions) {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);

        if (lastDate === null) {
          const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 1) {
            currentStreak = 1;
            lastDate = sessionDate;
          } else {
            break;
          }
        } else {
          const expectedDate = new Date(lastDate);
          expectedDate.setDate(expectedDate.getDate() - 1);
          if (expectedDate.getTime() === sessionDate.getTime()) {
            currentStreak++;
            lastDate = sessionDate;
          } else {
            break;
          }
        }
      }

      const response_rate = vol.total_doors > 0
        ? Math.round((vol.total_positive / vol.total_doors) * 100)
        : 0;

      // Award badges
      const badges = [];
      if (vol.total_doors >= 100) badges.push({ id: 'century', label: '💯 Century Club', description: '100+ doors knocked' });
      if (vol.total_doors >= 500) badges.push({ id: 'legend', label: '👑 Canvassing Legend', description: '500+ doors knocked' });
      if (currentStreak >= 7) badges.push({ id: 'week_warrior', label: '⚔️ Week Warrior', description: '7-day streak' });
      if (currentStreak >= 14) badges.push({ id: 'month_master', label: '🏆 Month Master', description: '14-day streak' });
      if (response_rate >= 40) badges.push({ id: 'persuader', label: '🎯 Persuader', description: '40%+ response rate' });
      if (response_rate >= 50) badges.push({ id: 'master_persuader', label: '💎 Master Persuader', description: '50%+ response rate' });
      if (vol.sessions.length >= 20) badges.push({ id: 'dedicated', label: '🔥 Dedicated', description: '20+ sessions' });
      if (sortedSessions.length > 0 && new Date() - new Date(sortedSessions[0].date) < 24 * 60 * 60 * 1000) {
        badges.push({ id: 'active_today', label: '⭐ Active Today', description: 'Canvassed today' });
      }

      // Calculate last session
      const lastSession = sortedSessions[0]?.date || null;
      const daysSinceLastSession = lastSession
        ? Math.floor((today - new Date(lastSession)) / (1000 * 60 * 60 * 24))
        : null;

      return {
        email,
        name: vol.name,
        total_doors: vol.total_doors,
        total_positive: vol.total_positive,
        response_rate,
        sessions_count: vol.sessions.length,
        current_streak: currentStreak,
        last_session: lastSession,
        days_since_last_session: daysSinceLastSession,
        badges,
        momentum_score: (vol.total_doors * 0.4) + (currentStreak * 10) + (response_rate * 0.5),
      };
    });

    // Sort by momentum (total doors + streak bonus + response rate)
    const ranked = volunteers.sort((a, b) => b.momentum_score - a.momentum_score);

    return Response.json({
      success: true,
      volunteers: ranked,
      summary: {
        total_volunteers: ranked.length,
        most_active: ranked[0]?.name || 'N/A',
        top_streak: Math.max(...ranked.map(v => v.current_streak), 0),
        average_response_rate: ranked.length > 0
          ? Math.round(ranked.reduce((sum, v) => sum + v.response_rate, 0) / ranked.length)
          : 0,
      },
    });
  } catch (error) {
    console.error('Error calculating achievements:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});