import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Calculate date range (past 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Fetch data for the past week
    const [logs, contacts, interactions] = await Promise.all([
      base44.asServiceRole.entities.CanvassingLog.list('-session_date', 1000),
      base44.asServiceRole.entities.Contact.list('name', 5000),
      base44.asServiceRole.entities.ContactInteraction.list('-date', 2000),
    ]);

    // Filter for past 7 days
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.session_date);
      return logDate >= weekAgo && logDate <= today;
    });

    const weekInteractions = interactions.filter(int => {
      const intDate = new Date(int.date);
      return intDate >= weekAgo && intDate <= today;
    });

    // Calculate progress metrics
    const totalDoorsThisWeek = weekLogs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0);
    const totalPositiveThisWeek = weekLogs.reduce((sum, log) => sum + (log.positive_responses || 0), 0);
    const totalNegativeThisWeek = weekLogs.reduce((sum, log) => sum + (log.negative_responses || 0), 0);
    const totalUndecidedThisWeek = weekLogs.reduce((sum, log) => sum + (log.undecided_count || 0), 0);
    const sessionsThisWeek = weekLogs.length;
    const volunteersThisWeek = new Set(weekLogs.map(log => log.volunteer_email)).size;

    const weeklyResponseRate = totalDoorsThisWeek > 0
      ? Math.round((totalPositiveThisWeek / totalDoorsThisWeek) * 100)
      : 0;

    // Sentiment breakdown
    const supportBreakdown = {
      strong_supporter: contacts.filter(c => c.support_level === 'strong_supporter').length,
      leaning: contacts.filter(c => c.support_level === 'leaning').length,
      undecided: contacts.filter(c => c.support_level === 'undecided').length,
      opposed: contacts.filter(c => c.support_level === 'opposed').length,
      unknown: contacts.filter(c => c.support_level === 'unknown').length,
    };

    // Coverage analysis
    const canvassedContacts = contacts.filter(c => c.canvassed).length;
    const uncanvassedContacts = contacts.length - canvassedContacts;
    const coveragePercentage = contacts.length > 0
      ? Math.round((canvassedContacts / contacts.length) * 100)
      : 0;

    // Top performers
    const volunteerStats = {};
    weekLogs.forEach(log => {
      const email = log.volunteer_email || 'unknown';
      if (!volunteerStats[email]) {
        volunteerStats[email] = {
          name: log.volunteer_name || 'Unknown',
          doors: 0,
          positive: 0,
          sessions: 0,
        };
      }
      volunteerStats[email].doors += log.doors_knocked || 0;
      volunteerStats[email].positive += log.positive_responses || 0;
      volunteerStats[email].sessions += 1;
    });

    const topVolunteers = Object.values(volunteerStats)
      .sort((a, b) => b.doors - a.doors)
      .slice(0, 5);

    // Key issues from interactions
    const issuesMentioned = {};
    weekInteractions.forEach(int => {
      if (int.notes) {
        const words = int.notes.toLowerCase().split(/[\s,\.]+/);
        const keywords = ['housing', 'transport', 'environment', 'health', 'education', 'economy', 'roads', 'bin', 'park', 'school'];
        words.forEach(word => {
          if (keywords.includes(word)) {
            issuesMentioned[word] = (issuesMentioned[word] || 0) + 1;
          }
        });
      }
    });

    const topIssues = Object.entries(issuesMentioned)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    // Generate summary object for PDF
    const summary = {
      week_ending: today.toISOString().split('T')[0],
      week_starting: weekAgo.toISOString().split('T')[0],
      total_doors_knocked: totalDoorsThisWeek,
      total_positive_responses: totalPositiveThisWeek,
      total_negative_responses: totalNegativeThisWeek,
      total_undecided: totalUndecidedThisWeek,
      response_rate: weeklyResponseRate,
      sessions_conducted: sessionsThisWeek,
      active_volunteers: volunteersThisWeek,
      average_doors_per_session: sessionsThisWeek > 0 ? Math.round(totalDoorsThisWeek / sessionsThisWeek) : 0,
      overall_coverage: coveragePercentage,
      total_contacts: contacts.length,
      canvassed_contacts: canvassedContacts,
      uncanvassed_contacts: uncanvassedContacts,
      support_breakdown: supportBreakdown,
      top_volunteers: topVolunteers,
      top_issues: topIssues,
    };

    // Fetch organizer emails (all admin users)
    const users = await base44.asServiceRole.entities.User.list('email', 100);
    const organizerEmails = users
      .filter(u => u.role === 'admin')
      .map(u => u.email)
      .filter(Boolean);

    if (organizerEmails.length === 0) {
      return Response.json({
        success: false,
        message: 'No organizers found to email',
        summary,
      });
    }

    // Generate simple HTML summary for email (since PDF generation in Deno is complex)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5016; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; width: 48%; margin: 1%; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .metric-value { font-size: 28px; font-weight: bold; color: #2d5016; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #e8f0e1; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #2d5016; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; color: #2d5016; margin-bottom: 15px; border-bottom: 2px solid #2d5016; padding-bottom: 10px; }
    .gap { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; }
    .success { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; border-radius: 4px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Canvassing Summary</h1>
      <p style="margin: 10px 0 0 0;">Week of ${summary.week_starting} to ${summary.week_ending}</p>
    </div>

    <div class="section">
      <div class="section-title">📈 Key Metrics</div>
      <div class="metric">
        <div class="metric-value">${summary.total_doors_knocked}</div>
        <div class="metric-label">Doors Knocked</div>
      </div>
      <div class="metric">
        <div class="metric-value">${summary.response_rate}%</div>
        <div class="metric-label">Response Rate</div>
      </div>
      <div class="metric">
        <div class="metric-value">${summary.sessions_conducted}</div>
        <div class="metric-label">Sessions</div>
      </div>
      <div class="metric">
        <div class="metric-value">${summary.active_volunteers}</div>
        <div class="metric-label">Volunteers Active</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">💬 Sentiment Breakdown</div>
      <table>
        <tr>
          <th>Support Level</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
        <tr>
          <td>Strong Supporters</td>
          <td>${summary.support_breakdown.strong_supporter}</td>
          <td>${summary.total_contacts > 0 ? Math.round((summary.support_breakdown.strong_supporter / summary.total_contacts) * 100) : 0}%</td>
        </tr>
        <tr>
          <td>Leaning</td>
          <td>${summary.support_breakdown.leaning}</td>
          <td>${summary.total_contacts > 0 ? Math.round((summary.support_breakdown.leaning / summary.total_contacts) * 100) : 0}%</td>
        </tr>
        <tr>
          <td>Undecided</td>
          <td>${summary.support_breakdown.undecided}</td>
          <td>${summary.total_contacts > 0 ? Math.round((summary.support_breakdown.undecided / summary.total_contacts) * 100) : 0}%</td>
        </tr>
        <tr>
          <td>Opposed</td>
          <td>${summary.support_breakdown.opposed}</td>
          <td>${summary.total_contacts > 0 ? Math.round((summary.support_breakdown.opposed / summary.total_contacts) * 100) : 0}%</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">🗺️ Coverage Status</div>
      <div class="success">
        <strong>Canvassing Progress:</strong> ${summary.canvassed_contacts} of ${summary.total_contacts} contacts (${summary.overall_coverage}%)
      </div>
      ${summary.overall_coverage < 70 ? `
        <div class="gap">
          <strong>⚠️ Coverage Gap:</strong> ${summary.uncanvassed_contacts} contacts remain uncanvassed. Prioritize these areas next week.
        </div>
      ` : `
        <div class="success">
          <strong>✓ Great Progress:</strong> Coverage is above 70%. Keep up the momentum!
        </div>
      `}
    </div>

    ${summary.top_volunteers.length > 0 ? `
    <div class="section">
      <div class="section-title">⭐ Top Volunteers</div>
      <table>
        <tr>
          <th>Volunteer</th>
          <th>Doors</th>
          <th>Sessions</th>
        </tr>
        ${summary.top_volunteers.map(vol => `
        <tr>
          <td>${vol.name}</td>
          <td>${vol.doors}</td>
          <td>${vol.sessions}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

    ${summary.top_issues.length > 0 ? `
    <div class="section">
      <div class="section-title">💡 Top Issues Mentioned</div>
      <ul>
        ${summary.top_issues.map(issue => `<li><strong>${issue.issue}:</strong> ${issue.count} mentions</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="footer">
      <p>Automatic weekly summary from Canvassing Campaign Manager</p>
      <p>${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to all organizers
    const emailPromises = organizerEmails.map(email =>
      base44.integrations.Core.SendEmail({
        to: email,
        subject: `📊 Weekly Canvassing Summary — Week of ${summary.week_starting}`,
        body: htmlContent,
      })
    );

    await Promise.all(emailPromises);

    return Response.json({
      success: true,
      message: `Summary emailed to ${organizerEmails.length} organizer(s)`,
      summary,
      recipients: organizerEmails,
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});