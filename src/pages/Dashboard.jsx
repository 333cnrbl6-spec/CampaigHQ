import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '@/lib/CampaignContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaignStats } from '@/hooks/useCampaignMemo';
import DataFetchError from '@/components/DataFetchError';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Users, Calendar, ClipboardList, Leaf, TrendingUp, Zap, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '../components/dashboard/StatCard';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import SupportBreakdown from '../components/dashboard/SupportBreakdown';
import RecentActivity from '../components/dashboard/RecentActivity';
import CanvassingMap from '../components/dashboard/CanvassingMap';
import SupportLevelWidget from '../components/dashboard/SupportLevelWidget';
import GamifiedLeaderboard from '../components/dashboard/GamifiedLeaderboard';
import SupportAnalytics from '../components/dashboard/SupportAnalytics';
import VolunteerGamification from '../components/dashboard/VolunteerGamification';
import InfrastructureStatus from '../components/dashboard/InfrastructureStatus';
import WeeklySummaryWidget from '../components/dashboard/WeeklySummaryWidget';
import CanvassingProgressWidget from '../components/dashboard/CanvassingProgressWidget';
import SupportTrendsWidget from '../components/dashboard/SupportTrendsWidget';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';

export default function Dashboard() {
  const [geocodingStatus, setGecodingStatus] = useState(null);
  const { campaign, user } = useCampaign();
  const navigate = useNavigate();
  
  // For national demo/sales pitch account, redirect to national dashboard
  useEffect(() => {
    if (user?.role === 'admin' && user?.email?.includes('national')) {
      navigate('/national');
    }
  }, [user?.role, user?.email, navigate]);
  
  // Defensive: campaign might not have loaded yet
  const campaignId = campaign?.id;

  // Fetch all contacts for campaign via entity list (RLS-scoped by campaign_id)
  const { data: contacts = [], error: contactError, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Contact.list('-created_date', 50000);
        return Array.isArray(all) ? all.filter(c => c.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
    refetchInterval: 120000,
  });

  // Fetch events directly from entity
  const { data: events = [], error: eventError, refetch: refetchEvents } = useQuery({
    queryKey: ['events', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.CampaignEvent.list('-created_date', 1000);
        return Array.isArray(all) ? all.filter(e => e.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch events:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 180000,
    refetchInterval: 180000,
  });

  // Fetch tasks directly from entity
  const { data: tasks = [], error: taskError, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Task.list('-created_date', 1000);
        return Array.isArray(all) ? all.filter(t => t.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
    refetchInterval: 120000,
  });

  // Fetch interactions directly from entity
  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.ContactInteraction.list('-created_date', 5000);
        return Array.isArray(all) ? all : [];
      } catch (err) {
        console.error('Failed to fetch interactions:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  // Fetch logs directly from entity
  const { data: logs = [] } = useQuery({
    queryKey: ['logs', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.CanvassingLog.list('-created_date', 5000);
        return Array.isArray(all) ? all.filter(l => l.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch logs:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
    refetchInterval: 120000,
  });

  // Fetch issues directly from entity
  const { data: issues = [] } = useQuery({
    queryKey: ['issues', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Issue.list('-mentions_count', 100);
        return Array.isArray(all) ? all.filter(i => i.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch issues:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
  });

  // Use memoized stats calculations
  const stats = useCampaignStats(contacts, logs, tasks);
  const upcomingEvents = Array.isArray(events) ? events.filter(e => e?.status === 'upcoming') : [];

  // Show data fetch error if present
  const dataError = contactError || eventError || taskError;

  return (
    <div className="p-3 sm:p-6 lg:p-10 max-w-[1400px] mx-auto">
      {dataError && (
        <div className="mb-6">
          <DataFetchError 
            error={dataError} 
            onRetry={() => {
              refetchContacts();
              refetchEvents();
              refetchTasks();
            }}
            title="Unable to Load Dashboard Data" 
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">Campaign HQ</p>
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mt-1">
          {campaign?.name || 'Campaign'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {campaign?.party ? `${campaign.party} — ` : ''}{campaign?.candidate_name || 'Candidate'}
          {campaign?.constituency ? ` for ${campaign.constituency}` : ''}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Doors Knocked"
          value={stats.canvassed}
          subtitle={`of ${stats.totalContacts} contacts`}
          icon={Users}
        />
        <StatCard
          title="Supporters"
          value={stats.supporters}
          subtitle={stats.totalContacts > 0 ? `${stats.supportPercentage}% of contacts` : 'Start canvassing'}
          icon={TrendingUp}
        />
        <StatCard
          title="This Week"
          value={stats.doorsThisWeek}
          subtitle="doors knocked"
          icon={MapPin}
        />
        <StatCard
          title="Active Tasks"
          value={stats.activeTasks}
          subtitle={`${Array.isArray(tasks) ? tasks.filter(t => t.status === 'done').length : 0} completed`}
          icon={ClipboardList}
        />
      </div>

      {/* Infrastructure & Alerts */}
      <div className="mb-8">
        <InfrastructureStatus 
          contactsNeedingGeocode={stats.needsGeocoding}
          totalContacts={stats.totalContacts}
          onGeocodeClick={() => setGecodingStatus('processing')}
          onOptimizeClick={() => window.location.href = '/route-analysis'}
          geocodingInProgress={geocodingStatus === 'processing'}
        />
      </div>

      {/* Canvassing Map */}
      <ErrorBoundary>
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm mb-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Ward Canvassing Map</h3>
          <CanvassingMap contacts={contacts} />
        </div>
      </ErrorBoundary>

      {/* Support Level Widget — full width */}
      <ErrorBoundary>
        <div className="mb-6">
          <SupportLevelWidget contacts={Array.isArray(contacts) ? contacts : []} />
        </div>
      </ErrorBoundary>

      {/* Support Analytics — pie chart + undecided hotspots */}
      <ErrorBoundary>
        <div className="mb-6">
          <SupportAnalytics contacts={Array.isArray(contacts) ? contacts : []} />
        </div>
      </ErrorBoundary>

      {/* Volunteer Gamification — full width */}
      <ErrorBoundary>
        <div className="mb-6">
          <VolunteerGamification />
        </div>
      </ErrorBoundary>

      {/* Weekly Summary */}
      <div className="mb-8">
        <WeeklySummaryWidget logs={logs} contacts={contacts} />
      </div>

      {/* Key Metrics: Canvassing Progress + Support Trends */}
      <ErrorBoundary>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CanvassingProgressWidget logs={logs} campaign={campaign} isLoading={false} />
          <SupportTrendsWidget contacts={contacts} isLoading={false} />
        </div>
      </ErrorBoundary>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed campaignId={campaignId} limit={8} />
        <UpcomingEvents events={upcomingEvents} />
        <SupportBreakdown contacts={contacts} />
        <GamifiedLeaderboard interactions={interactions} contacts={contacts} />
        <RecentActivity contacts={contacts} events={events} tasks={tasks} />
        
        {/* Top Issues */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
          <h3 className="font-heading text-lg font-semibold mb-4">Top Local Issues</h3>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {issues.slice(0, 6).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{issue.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">{issue.category}</span>
                    {issue.mentions_count > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {issue.mentions_count} mentions
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}