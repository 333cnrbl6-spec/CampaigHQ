import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { useTurfSelection } from '@/lib/TurfSelectionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CanvassingStatsCards from '@/components/dashboard/CanvassingStatsCards';
import VolunteerProgressTable from '@/components/dashboard/VolunteerProgressTable';
import TurfBoundaryMap from '@/components/map/TurfBoundaryMap';
import CanvassingTurfPanel from '@/components/map/CanvassingTurfPanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Calendar } from 'lucide-react';

export default function CanvassingDashboard() {
  const { campaign } = useCampaign();
  const { selectedTurfId, setSelectedTurfId } = useTurfSelection();
  const [selectedTurf, setSelectedTurf] = useState(null);

  // Fetch all relevant data
  const { data: canvassingLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['canvassingLogs', campaign?.id],
    queryFn: () => base44.entities.CanvassingLog.filter({ campaign_id: campaign?.id }, '-session_date', 500),
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', campaign?.id],
    queryFn: () => base44.entities.Contact.filter({ campaign_id: campaign?.id }, 'name', 5000),
  });

  const { data: interactions = [], isLoading: interactionsLoading } = useQuery({
    queryKey: ['contactInteractions', campaign?.id],
    queryFn: () => base44.entities.ContactInteraction.filter({ campaign_id: campaign?.id }, '-date', 1000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', campaign?.id],
    queryFn: () => base44.entities.Task.filter({ category: 'canvassing', campaign_id: campaign?.id }),
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const all = await base44.entities.Turf.list('-created_date', 1000);
      return Array.isArray(all) ? all.filter(t => t.campaign_id === campaign.id) : [];
    },
  });

  const turfOptions = useMemo(() =>
    turfs
      .sort((a, b) => (a.parent_turf_id || '') > (b.parent_turf_id || '') ? 1 : -1)
      .map(t => ({
        id: t.id,
        label: t.part_label ? `${t.name} — Part ${t.part_label}` : t.name,
      })),
    [turfs]
  );

  // Filter data by turf if selected
  const filteredContacts = selectedTurfId
    ? contacts.filter(c => c.tags?.includes(turfs.find(t => t.id === selectedTurfId)?.name))
    : contacts;

  const filteredLogs = selectedTurfId
    ? canvassingLogs.filter(log => log.turf_id === selectedTurfId)
    : canvassingLogs;

  // Aggregate stats
  const stats = useMemo(() => {
    if (!filteredLogs.length && !interactions.length) {
      return {
        totalDoors: 0,
        sessionCount: 0,
        volunteersCount: 0,
        contactsCanvassed: 0,
        totalContacts: filteredContacts.length,
        dailyGoal: 100,
        positiveResponses: 0,
        negativeResponses: 0,
        noAnswers: 0,
        strong_supporter: 0,
        leaning: 0,
        undecided: 0,
        opposed: 0,
        unknown: 0,
        undecidedCount: 0,
      };
    }

    // From CanvassingLog
    const totalDoors = filteredLogs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0);
    const sessionsCount = filteredLogs.length;
    const volunteersCount = new Set(filteredLogs.map(l => l.volunteer_email)).size;
    const positiveResponses = filteredLogs.reduce((sum, log) => sum + (log.positive_responses || 0), 0);
    const negativeResponses = filteredLogs.reduce((sum, log) => sum + (log.negative_responses || 0), 0);
    const noAnswers = filteredLogs.reduce((sum, log) => sum + (log.no_answers || 0), 0);
    const undecidedCount = filteredLogs.reduce((sum, log) => sum + (log.undecided_count || 0), 0);

    // From Contact entity
    const canvassingMap = new Set();
    const supportLevels = {
      strong_supporter: 0,
      leaning: 0,
      undecided: 0,
      opposed: 0,
      unknown: 0,
    };

    filteredContacts.forEach(c => {
      if (c.canvassed) {
        canvassingMap.add(c.id);
      }
      if (c.support_level && c.canvassed) {
        supportLevels[c.support_level] = (supportLevels[c.support_level] || 0) + 1;
      }
    });

    // Daily goal from tasks or default
    const dailyGoalTask = tasks.find(t => t.title?.toLowerCase().includes('daily'));
    const dailyGoal = dailyGoalTask?.description ? parseInt(dailyGoalTask.description) : 100;

    return {
      totalDoors,
      sessionsCount,
      volunteersCount,
      contactsCanvassed: canvassingMap.size,
      totalContacts: filteredContacts.length,
      dailyGoal,
      positiveResponses,
      negativeResponses,
      noAnswers,
      undecidedCount,
      ...supportLevels,
    };
  }, [filteredLogs, filteredContacts, tasks]);

  // Volunteer progress
  const volunteerStats = useMemo(() => {
    const map = {};

    filteredLogs.forEach(log => {
      const email = log.volunteer_email;
      if (!map[email]) {
        map[email] = {
          email,
          name: log.volunteer_name || email.split('@')[0],
          doorsKnocked: 0,
          sessionsCount: 0,
          strong_supporter: 0,
          leaning: 0,
          undecided: 0,
          opposed: 0,
          positive: 0,
          negative: 0,
          lastSession: null,
        };
      }

      map[email].doorsKnocked += log.doors_knocked || 0;
      map[email].sessionsCount += 1;
      map[email].strong_supporter += 0; // Would need ContactInteraction data
      map[email].leaning += 0;
      map[email].undecided += (log.undecided_count || 0);
      map[email].opposed += 0;
      map[email].positive += log.positive_responses || 0;
      map[email].negative += log.negative_responses || 0;
      map[email].lastSession = log.session_date;
    });

    // Add daily goal per volunteer
    Object.values(map).forEach(v => {
      v.dailyGoal = stats.dailyGoal;
    });

    return Object.values(map);
  }, [filteredLogs, stats.dailyGoal]);

  // Support breakdown for pie chart
  const supportChartData = useMemo(() => {
    return [
      { name: 'Strong Supporter', value: stats.strong_supporter, fill: '#10b981' },
      { name: 'Leaning', value: stats.leaning, fill: '#3b82f6' },
      { name: 'Undecided', value: stats.undecided, fill: '#f59e0b' },
      { name: 'Opposed', value: stats.opposed, fill: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Daily activity trend
  const dailyTrend = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const trendMap = {};
    last7Days.forEach(date => {
      trendMap[date] = { date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short' }), doors: 0 };
    });

    filteredLogs.forEach(log => {
      const date = log.session_date;
      if (trendMap[date]) {
        trendMap[date].doors += log.doors_knocked || 0;
      }
    });

    return Object.values(trendMap);
  }, [filteredLogs]);

  const isLoading = logsLoading || contactsLoading || interactionsLoading;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h1 className="font-heading text-3xl font-bold">Canvassing Dashboard</h1>
             <p className="text-sm text-muted-foreground mt-1">Real-time campaign progress and volunteer performance</p>
           </div>
           <div className="flex items-center gap-3">
             {turfOptions.length > 0 && (
               <div className="w-72">
                 <Select value={selectedTurfId || ''} onValueChange={(v) => { setSelectedTurfId(v || null); setSelectedTurf(null); }}>
                   <SelectTrigger className="h-9">
                     <SelectValue placeholder="All zones" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value={null}>All zones</SelectItem>
                     {turfOptions.map(t => (
                       <SelectItem key={t.id} value={t.id}>
                         {t.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
             <Button 
               variant="outline" 
               size="sm" 
               className="gap-2"
               onClick={() => refetchLogs()}
               disabled={isLoading}
             >
               <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
               Refresh
             </Button>
           </div>
         </div>

        {/* Main stats cards */}
        <CanvassingStatsCards stats={stats} />

        {/* Map with turf boundaries */}
        {turfs.length > 0 && (
          <div className="relative">
            <Card>
              <CardHeader>
                <CardTitle>Turf Map & Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                        <TurfBoundaryMap 
                          turfs={turfs}
                          contacts={filteredContacts}
                          onTurfClick={setSelectedTurf}
                          highlightAssigned={true}
                        />
                      </div>
              </CardContent>
            </Card>
            
            {/* Turf detail panel */}
            {selectedTurf && (
              <CanvassingTurfPanel 
                  turf={selectedTurf}
                  contacts={filteredContacts}
                  logs={filteredLogs}
                  onClose={() => setSelectedTurf(null)}
                />
            )}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Support breakdown pie chart */}
          {supportChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Support Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={supportChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {supportChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 7-day trend */}
          {dailyTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  7-Day Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="doors" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Volunteer progress */}
        <VolunteerProgressTable volunteers={volunteerStats} />
      </div>
    </div>
  );
}