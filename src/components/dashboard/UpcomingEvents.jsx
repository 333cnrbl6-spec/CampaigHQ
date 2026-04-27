import React from 'react';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const typeColors = {
  canvassing: 'bg-primary/10 text-primary border-primary/20',
  hustings: 'bg-accent/20 text-accent-foreground border-accent/30',
  leafleting: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  meeting: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  social: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  fundraiser: 'bg-accent/20 text-accent-foreground border-accent/30',
  other: 'bg-muted text-muted-foreground border-border',
};

export default function UpcomingEvents({ events }) {
  if (!events?.length) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <h3 className="font-heading text-lg font-semibold mb-4">Upcoming Events</h3>
        <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
      <h3 className="font-heading text-lg font-semibold mb-4">Upcoming Events</h3>
      <div className="space-y-3">
        {events.slice(0, 5).map((event) => (
          <div key={event.id} className="flex items-start gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <div className="text-center min-w-[48px]">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                {event.date ? format(new Date(event.date), 'MMM') : '—'}
              </div>
              <div className="text-2xl font-bold font-heading text-primary">
                {event.date ? format(new Date(event.date), 'd') : '—'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{event.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {event.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {event.time}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3" /> {event.location}
                  </span>
                )}
              </div>
              <Badge variant="secondary" className={`mt-2 text-xs ${typeColors[event.type] || typeColors.other}`}>
                {event.type?.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}