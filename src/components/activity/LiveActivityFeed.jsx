import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { DoorOpen, Phone, Mail, MessageSquare, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useCampaign } from '@/lib/CampaignContext';
import DataFetchError from '@/components/DataFetchError';

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
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;

  // Fetch interactions directly from entity
  const { data: feed = [], isLoading, error, refetch } = useQuery({
    queryKey: ['interactions', campaignId, limit],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.ContactInteraction.list('-created_date', Math.max(limit * 2, 100));
        return Array.isArray(all) 
          ? all.filter(i => {
              // Try to match campaign scope by contact_id if available
              return true; // ContactInteraction doesn't have campaign_id, so we trust entity RLS
            }).slice(0, limit)
          : [];
      } catch (err) {
        console.error('Failed to fetch interactions:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  if (error) {
    return <DataFetchError error={error} onRetry={refetch} title="Unable to Load Activity" />;
  }

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
      {feed.map((item) => {
        const typeDisplay = item.type?.replace(/_/g, ' ') || 'Interaction';
        const outcomeDisplay = item.outcome?.replace(/_/g, ' ') || '';
        const dateDisplay = item.date || item.created_date 
          ? formatDistanceToNow(new Date(item.date || item.created_date), { addSuffix: true })
          : '';
        
        return (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              {TYPE_ICONS[item.type] || TYPE_ICONS.other}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.contact_name}
                <span className="font-normal text-muted-foreground"> — {typeDisplay}</span>
              </p>
              {item.notes && <p className="text-xs text-muted-foreground truncate">{item.notes}</p>}
              <div className="flex items-center gap-2 mt-1">
                {outcomeDisplay && (
                  <Badge className={`text-[10px] px-1.5 py-0 ${OUTCOME_COLORS[item.outcome] || ''}`}>
                    {outcomeDisplay}
                  </Badge>
                )}
                {item.logged_by && (
                  <span className="text-[10px] text-muted-foreground">by {item.logged_by}</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
              {dateDisplay}
            </div>
          </div>
        );
      })}
    </div>
  );
}