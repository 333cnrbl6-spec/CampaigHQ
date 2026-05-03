import React, { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';
import { CheckCircle2, X, HelpCircle, User, Clock, ArrowRight } from 'lucide-react';

const OUTCOME_CONFIG = {
  positive: { icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  negative: { icon: X, bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
  neutral: { icon: HelpCircle, bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' },
  no_answer: { icon: HelpCircle, bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100' },
};

export default function RecentActivityFeed({ campaignId, limit = 8 }) {
  const [recentItems, setRecentItems] = useState([]);

  // Fetch interactions with real-time refresh
  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['recent-interactions', campaignId],
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
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Fetch contacts for reference
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-feed', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Contact.list('-created_date', 10000);
        return Array.isArray(all) ? all.filter(c => c.campaign_id === campaignId) : [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
  });

  // Merge and sort interactions
  useEffect(() => {
    const merged = interactions.map(interaction => {
      const contact = contacts.find(c => c.id === interaction.contact_id);
      return {
        ...interaction,
        contact_name: contact?.name || interaction.contact_id || 'Unknown',
      };
    });

    setRecentItems(merged.slice(0, limit));
  }, [interactions, contacts, limit]);

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm h-full">
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest door knock outcomes</p>
        </div>

        {isLoading ? (
          <ProcessingFeedback
            label="Loading recent activity…"
            detail="Fetching latest voter interactions."
            tips={['Activity updates in real-time every 30 seconds.', 'Includes door knock outcomes and conversations.']}
          />
        ) : recentItems.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">No activity yet. Start logging door knocks to see live updates.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {recentItems.map((item, idx) => {
              const config = OUTCOME_CONFIG[item.outcome] || OUTCOME_CONFIG.neutral;
              const Icon = config.icon;
              
              return (
                <div
                  key={item.id || idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-border/50 ${config.bg} group hover:shadow-sm transition-all`}
                >
                  {/* Outcome icon */}
                  <div className={`flex-shrink-0 p-2 rounded-md ${config.badge}`}>
                    <Icon className={`w-4 h-4 ${config.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.contact_name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{item.type?.replace('_', ' ')}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="capitalize">{item.outcome}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.created_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}