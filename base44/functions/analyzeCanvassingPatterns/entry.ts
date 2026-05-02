import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch canvassing logs and interactions for this campaign
    const [logs, interactions] = await Promise.all([
      base44.asServiceRole.entities.CanvassingLog.filter({ campaign_id }, '-session_date', 1000),
      base44.asServiceRole.entities.ContactInteraction.filter({ campaign_id }, '-date', 2000),
    ]);

    // Group logs by street and time window
    const streetPatterns = {};
    const timeWindows = {
      'early_morning': { start: 8, end: 10, label: '8am-10am' },
      'morning': { start: 10, end: 12, label: '10am-12pm' },
      'lunch': { start: 12, end: 14, label: '12pm-2pm' },
      'afternoon': { start: 14, end: 17, label: '2pm-5pm' },
      'evening': { start: 17, end: 19, label: '5pm-7pm' },
      'late_evening': { start: 19, end: 21, label: '7pm-9pm' },
    };

    // Analyze each canvassing log
    logs.forEach(log => {
      if (!log.street_name) return;

      const street = log.street_name.toLowerCase().trim();
      if (!streetPatterns[street]) {
        streetPatterns[street] = {
          street_name: log.street_name,
          total_sessions: 0,
          total_doors: 0,
          positive_responses: 0,
          response_rate: 0,
          windows: {},
          sessions_data: [],
        };

        // Initialize windows
        Object.keys(timeWindows).forEach(w => {
          streetPatterns[street].windows[w] = {
            label: timeWindows[w].label,
            sessions: 0,
            doors: 0,
            responses: 0,
            response_rate: 0,
          };
        });
      }

      streetPatterns[street].total_sessions += 1;
      streetPatterns[street].total_doors += log.doors_knocked || 0;
      streetPatterns[street].positive_responses += log.positive_responses || 0;
      streetPatterns[street].sessions_data.push({
        date: log.session_date,
        doors: log.doors_knocked || 0,
        positive: log.positive_responses || 0,
      });

      // Determine time window from session_date (assume session started during typical hours)
      // For streets without time data, we'll estimate based on day of week
      const sessionDate = new Date(log.session_date);
      const dayOfWeek = sessionDate.getDay();
      
      // Estimate time window based on day (weekday vs weekend) and average patterns
      let estimatedWindow = 'afternoon'; // default
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        estimatedWindow = 'morning';
      } else { // Weekday
        estimatedWindow = 'afternoon'; // Most common for canvassing
      }

      const window = streetPatterns[street].windows[estimatedWindow];
      window.sessions += 1;
      window.doors += log.doors_knocked || 0;
      window.responses += log.positive_responses || 0;
    });

    // Calculate response rates
    Object.values(streetPatterns).forEach(street => {
      street.response_rate = street.total_doors > 0
        ? Math.round((street.positive_responses / street.total_doors) * 100)
        : 0;

      Object.values(street.windows).forEach(window => {
        window.response_rate = window.doors > 0
          ? Math.round((window.responses / window.doors) * 100)
          : 0;
      });
    });

    // Sort streets by response rate
    const sortedStreets = Object.values(streetPatterns)
      .sort((a, b) => b.response_rate - a.response_rate);

    // Find optimal windows for each street
    const streetRecommendations = sortedStreets.map(street => {
      const windows = Object.entries(street.windows)
        .map(([key, data]) => ({
          ...data,
          key,
          score: (data.response_rate * 0.6) + ((data.sessions / Math.max(...Object.values(street.windows).map(w => w.sessions))) * 40),
        }))
        .sort((a, b) => b.score - a.score);

      return {
        street_name: street.street_name,
        total_sessions: street.total_sessions,
        total_doors: street.total_doors,
        overall_response_rate: street.response_rate,
        optimal_window: windows[0]?.label || 'Afternoon',
        optimal_response_rate: windows[0]?.response_rate || 0,
        all_windows: windows,
        confidence: Math.min(100, street.total_sessions * 10), // Higher confidence with more data
      };
    });

    return Response.json({
      success: true,
      patterns: streetRecommendations,
      summary: {
        total_streets: sortedStreets.length,
        total_sessions: logs.length,
        average_response_rate: Math.round(
          sortedStreets.reduce((sum, s) => sum + s.response_rate, 0) / sortedStreets.length
        ),
        best_performing_street: sortedStreets[0]?.street_name || 'N/A',
        best_response_rate: sortedStreets[0]?.response_rate || 0,
      },
    });
  } catch (error) {
    console.error('Error analyzing canvassing patterns:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});