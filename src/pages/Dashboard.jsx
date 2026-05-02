import React, { useState } from 'react';
import { useCampaign } from '@/lib/CampaignContext';
import useSecureData from '@/hooks/useSecureData';
import DataFetchError from '@/components/DataFetchError';
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

export default function Dashboard() {
  const [geocodingStatus, setGecodingStatus] = useState(null);
  const [showOptimizationHint, setShowOptimizationHint] = useState(true);
  const { campaignId } = useCampaign();

  // Fetch RLS-protected data with secure data hooks — defensive loading with defaults
  const { data: contacts = [], error: contactError, refetch: refetchContacts } = useSecureData(
    'getContactDetails',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 120000, refetchInterval: 120000, enabled: !!campaignId }
  );

  const { data: events = [], error: eventError, refetch: refetchEvents } = useSecureData(
    'getActivityFeed',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 180000, refetchInterval: 180000, enabled: !!campaignId }
  );

  const { data: tasks = [], error: taskError, refetch: refetchTasks } = useSecureData(
    'getSessionLogs',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 120000, refetchInterval: 120000, enabled: !!campaignId }
  );

  // Get interactions via ActivityFeed function
  const { data: allActivity = [] } = useSecureData(
    'getActivityFeed',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 60000, refetchInterval: 60000, enabled: !!campaignId }
  );
  const interactions = Array.isArray(allActivity) ? allActivity : [];

  // Get logs via SessionLogs function
  const { data: logs = [] } = useSecureData(
    'getSessionLogs',
    campaignId ? { campaign_id: campaignId } : null,
    { staleTime: 120000, refetchInterval: 120000, enabled: !!campaignId }
  );

  // For issues, use a simple empty array since we don't have a dedicated function yet
  const issues = [];

  const canvassed = Array.isArray(contacts) ? contacts.filter(c => c?.canvassed).length : 0;
  const supporters = Array.isArray(contacts) ? contacts.filter(c => ['strong_supporter', 'leaning'].includes(c?.support_level)).length : 0;
  const upcomingEvents = Array.isArray(events) ? events.filter(e => e?.status === 'upcoming') : [];
  const activeTasks = Array.isArray(tasks) ? tasks.filter(t => t?.status !== 'done').length : 0;
  // Exclude latitude=0 sentinel (permanently failed) from "needs geocoding" count
  const needsGeocoding = Array.isArray(contacts) ? contacts.filter(c => (!c?.latitude || !c?.longitude) && c?.latitude !== 0).length : 0;
  const doorsThisWeek = Array.isArray(logs) ? logs.reduce((sum, l) => sum + (l?.doors_knocked || 0), 0) : 0;

  // Show data fetch error if present
  const dataError = contactError || eventError || taskError;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
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
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wider">Campaign HQ</p>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold mt-1">
          Tyldesley & Mosley Common
        </h1>
        <p className="text-muted-foreground mt-1">
          Green Party — Paul Binns for Council
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Doors Knocked"
          value={canvassed}
          subtitle={`of ${contacts.length} contacts`}
          icon={Users}
        />
        <StatCard
          title="Supporters"
          value={supporters}
          subtitle={contacts.length > 0 ? `${Math.round((supporters / contacts.length) * 100)}% of contacts` : 'Start canvassing'}
          icon={TrendingUp}
        />
        <StatCard
          title="This Week"
          value={doorsThisWeek}
          subtitle="doors knocked"
          icon={MapPin}
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          subtitle={`${tasks.filter(t => t.status === 'done').length} completed`}
          icon={ClipboardList}
        />
      </div>

      {/* Infrastructure & Alerts */}
      <div className="mb-8">
        <InfrastructureStatus 
          contactsNeedingGeocode={needsGeocoding}
          totalContacts={contacts.length}
          onGeocodeClick={() => setGecodingStatus('processing')}
          onOptimizeClick={() => window.location.href = '/route-analysis'}
          geocodingInProgress={geocodingStatus === 'processing'}
        />
      </div>

      {/* Canvassing Map */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm mb-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Ward Canvassing Map</h3>
        <CanvassingMap contacts={contacts} />
      </div>

      {/* Support Level Widget — full width */}
      <div className="mb-6">
        <SupportLevelWidget contacts={contacts} />
      </div>

      {/* Support Analytics — pie chart + undecided hotspots */}
      <div className="mb-6">
        <SupportAnalytics contacts={contacts} />
      </div>

      {/* Volunteer Gamification — full width */}
      <div className="mb-6">
        <VolunteerGamification />
      </div>

      {/* Weekly Summary */}
      <div className="mb-8">
        <WeeklySummaryWidget logs={logs} contacts={contacts} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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