import React, { useState, useMemo } from 'react';
import { useCampaign } from '@/lib/CampaignContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataFetchError from '@/components/DataFetchError';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';
import { Send, FileText, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function WeeklyReportDashboard() {
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [sendStatus, setSendStatus] = useState(null);

  // Fetch latest canvassing logs for weekly summary
  const { data: logs = [], isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useQuery({
    queryKey: ['canvassing-logs-weekly', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      try {
        const all = await base44.entities.CanvassingLog.list('-session_date', 5000);
        return Array.isArray(all)
          ? all.filter(l => l.campaign_id === campaignId && new Date(l.session_date) >= sevenDaysAgo)
          : [];
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 60000,
  });

  // Fetch contacts for breakdown
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-weekly', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Contact.list('name', 50000);
        return Array.isArray(all) ? all.filter(c => c.campaign_id === campaignId) : [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
  });

  // Calculate metrics
  const metrics = React.useMemo(() => {
    if (!logs.length) {
      return {
        totalDoors: 0,
        totalSessions: 0,
        responseRate: 0,
        activeVolunteers: 0,
        topVolunteers: [],
        supportBreakdown: {},
        coverage: 0,
      };
    }

    const totalDoors = logs.reduce((sum, l) => sum + (l.doors_knocked || 0), 0);
    const totalPositive = logs.reduce((sum, l) => sum + (l.positive_responses || 0), 0);
    const totalSessions = logs.length;
    const activeVolunteers = new Set(logs.map(l => l.volunteer_email)).size;
    const responseRate = totalDoors > 0 ? Math.round((totalPositive / totalDoors) * 100) : 0;

    // Top volunteers
    const volStats = {};
    logs.forEach(log => {
      const email = log.volunteer_email || 'unknown';
      if (!volStats[email]) {
        volStats[email] = { name: log.volunteer_name || 'Unknown', doors: 0, sessions: 0 };
      }
      volStats[email].doors += log.doors_knocked || 0;
      volStats[email].sessions += 1;
    });

    const topVolunteers = Object.values(volStats)
      .sort((a, b) => b.doors - a.doors)
      .slice(0, 5);

    // Support breakdown
    const supportBreakdown = {
      strong_supporter: contacts.filter(c => c.support_level === 'strong_supporter').length,
      leaning: contacts.filter(c => c.support_level === 'leaning').length,
      undecided: contacts.filter(c => c.support_level === 'undecided').length,
      opposed: contacts.filter(c => c.support_level === 'opposed').length,
    };

    const canvassed = contacts.filter(c => c.canvassed).length;
    const coverage = contacts.length > 0 ? Math.round((canvassed / contacts.length) * 100) : 0;

    return {
      totalDoors,
      totalSessions,
      responseRate,
      activeVolunteers,
      topVolunteers,
      supportBreakdown,
      coverage,
      totalContacts: contacts.length,
      canvassedContacts: canvassed,
    };
  }, [logs, contacts]);

  const handleSendWeeklyReport = async () => {
    setSending(true);
    setSendStatus(null);
    try {
      const response = await base44.functions.invoke('sendDailyVolunteerSummary', {
        campaign_id: campaignId,
      });
      setLastSent(new Date());
      setSendStatus({ type: 'success', message: `Report sent successfully to ${response.data.summaries?.length || 0} volunteer(s)` });
      refetchLogs();
    } catch (error) {
      setSendStatus({ type: 'error', message: error.message || 'Failed to send report' });
    } finally {
      setSending(false);
    }
  };

  if (logsLoading) {
    return (
      <div className="p-6 lg:p-10">
        <ProcessingFeedback
          label="Loading weekly data…"
          detail="Fetching canvassing logs and contact metrics."
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" /> Weekly Report Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">View canvassing metrics and send automated weekly PDF summaries to campaign managers</p>
      </div>

      {logsError && <DataFetchError error={logsError} onRetry={refetchLogs} />}

      {/* Send Report Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" /> Send Weekly Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate and email a comprehensive PDF summary of this week's canvassing activity, KPIs, and top performer rankings to campaign organizers.
          </p>
          
          {sendStatus && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-lg ${
              sendStatus.type === 'success'
                ? 'bg-green-50 text-green-900 border border-green-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}>
              {sendStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{sendStatus.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lastSent && (
              <>
                <Clock className="w-4 h-4" />
                <span>Last sent: {lastSent.toLocaleString('en-GB', { 
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                })}</span>
              </>
            )}
          </div>

          <Button 
            onClick={handleSendWeeklyReport}
            disabled={sending || logs.length === 0}
            className="gap-2"
            size="lg"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating & Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Weekly Report Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">No Data Yet</h3>
            <p className="text-sm text-blue-800">Start canvassing sessions to generate weekly reports and metrics.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Metrics */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{metrics.totalDoors}</div>
                <div className="text-sm text-muted-foreground mt-1">Doors Knocked</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{metrics.responseRate}%</div>
                <div className="text-sm text-muted-foreground mt-1">Response Rate</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{metrics.coverage}%</div>
                <div className="text-sm text-muted-foreground mt-1">Coverage</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Volunteers */}
      {metrics.topVolunteers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⭐ Top Volunteer Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold">Volunteer</th>
                  <th className="text-right py-2 px-3 font-semibold">Doors</th>
                  <th className="text-right py-2 px-3 font-semibold">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topVolunteers.map((vol, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-medium">{vol.name}</td>
                    <td className="py-2.5 px-3 text-right">{vol.doors}</td>
                    <td className="py-2.5 px-3 text-right">{vol.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Support Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>💬 Voter Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(metrics.supportBreakdown).map(([level, count]) => (
              <div key={level} className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xl font-bold text-primary">{count}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{level.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📧 Email Recipients</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Weekly reports are automatically sent to all campaign organizers (admin users). The report includes:
          <ul className="list-disc list-inside mt-3 space-y-1">
            <li>Total doors knocked and response rates</li>
            <li>Active volunteer count and session metrics</li>
            <li>Support level breakdown (strong supporters, leaning, undecided, opposed)</li>
            <li>Canvassing coverage percentage</li>
            <li>Top 5 volunteer performers ranked by doors knocked</li>
            <li>Key issues mentioned by voters</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}