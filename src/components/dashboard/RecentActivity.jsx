import React from 'react';
import { format } from 'date-fns';
import { Users, Calendar, ClipboardList, Leaf } from 'lucide-react';

export default function RecentActivity({ contacts, events, tasks }) {
  const activities = [
    ...(contacts || []).slice(0, 3).map(c => ({
      type: 'contact',
      icon: Users,
      text: `${c.name} contacted`,
      detail: c.support_level?.replace(/_/g, ' '),
      date: c.canvass_date || c.created_date,
    })),
    ...(events || []).slice(0, 3).map(e => ({
      type: 'event',
      icon: Calendar,
      text: e.title,
      detail: e.type,
      date: e.date || e.created_date,
    })),
    ...(tasks || []).slice(0, 3).map(t => ({
      type: 'task',
      icon: ClipboardList,
      text: t.title,
      detail: t.status?.replace(/_/g, ' '),
      date: t.due_date || t.created_date,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
      <h3 className="font-heading text-lg font-semibold mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet. Start by adding contacts or events.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.text}</p>
                  {a.detail && <p className="text-xs text-muted-foreground capitalize">{a.detail}</p>}
                </div>
                {a.date && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(a.date), 'MMM d')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}