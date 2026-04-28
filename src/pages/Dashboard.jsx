import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, ClipboardList, Leaf, TrendingUp } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import SupportBreakdown from '../components/dashboard/SupportBreakdown';
import RecentActivity from '../components/dashboard/RecentActivity';
import CanvassingMap from '../components/dashboard/CanvassingMap';

export default function Dashboard() {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.CampaignEvent.list('-date', 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 50),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list('-priority', 50),
  });

  const canvassed = contacts.filter(c => c.canvassed).length;
  const supporters = contacts.filter(c => ['strong_supporter', 'leaning'].includes(c.support_level)).length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const activeTasks = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
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
          title="Upcoming Events"
          value={upcomingEvents.length}
          subtitle="scheduled"
          icon={Calendar}
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          subtitle={`${tasks.filter(t => t.status === 'done').length} completed`}
          icon={ClipboardList}
        />
      </div>

      {/* Canvassing Map */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm mb-6">
        <h3 className="font-heading text-lg font-semibold mb-4">Ward Canvassing Map</h3>
        <CanvassingMap contacts={contacts} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents events={upcomingEvents} />
        <SupportBreakdown contacts={contacts} />
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