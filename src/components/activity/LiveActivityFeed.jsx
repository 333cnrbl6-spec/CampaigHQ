import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DoorOpen, Phone, Mail, MessageSquare, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  door_knock: <DoorOpen className="w-3.5 h-3.5" />,
  phone_call: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  text: <MessageSquare className="w-3.5 h-3.5" />,
  meeting: <Users className="w-3.5 h-3.5" />,
  other: <MessageSquare className="w-3.5 h-3.5" />,
};

const OUTCOME_COLORS = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-slate-100 text-slate-700',
  negative: 'bg-red-100 text-red-800',
  no_answer: 'bg-yellow-100 text-yellow-800',
};

export default function LiveActivityFeed({ limit = 20 }) {
  const [feed, setFeed] = useState([]);

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions-feed'],
    queryFn: () => base44.entities.ContactInteraction.list('-created_date', limit),
    refetchInterval: 30000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  useEffect(() => {
    const contactMap = {};
    contacts.forEach(c => { contactMap[c.id] = c.name; });
    const enriched = interactions.map(i => ({
      ...i,
      contact_name: contactMap[i.contact_id] || 'Unknown',
    }));
    setFeed(enriched);
  }, [interactions, contacts]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.ContactInteraction.subscribe((event) => {
      if (event.type === 'create') {
        setFeed(prev => [event.data, ...prev].slice(0, limit));
      }
    });
    return unsub;
  }, [limit]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
        No activity yet. Interactions will appear here in real time.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {feed.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
            {TYPE_ICONS[item.type] || TYPE_ICONS.other}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {item.contact_name}
              <span className="font-normal text-muted-foreground"> — {item.type?.replace('_', ' ')}</span>
            </p>
            {item.notes && <p className="text-xs text-muted-foreground truncate">{item.notes}</p>}
            <div className="flex items-center gap-2 mt-1">
              {item.outcome && (
                <Badge className={`text-[10px] px-1.5 py-0 ${OUTCOME_COLORS[item.outcome] || ''}`}>
                  {item.outcome?.replace('_', ' ')}
                </Badge>
              )}
              {item.logged_by && (
                <span className="text-[10px] text-muted-foreground">by {item.logged_by}</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
            {item.date ? item.date : ''}
          </div>
        </div>
      ))}
    </div>
  );
}