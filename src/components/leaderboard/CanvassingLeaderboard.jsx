import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataFetchError from '@/components/DataFetchError';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';
import { Trophy, Medal, Star, TrendingUp, Users, MessageSquare, DoorOpen, Target } from 'lucide-react';

const RANK_STYLES = [
  { bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-400 text-yellow-900', icon: <Trophy className="w-5 h-5 text-yellow-500" /> },
  { bg: 'bg-slate-50 border-slate-200', badge: 'bg-slate-400 text-white', icon: <Medal className="w-5 h-5 text-slate-400" /> },
  { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-400 text-white', icon: <Medal className="w-5 h-5 text-orange-400" /> },
];

function StatPill({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center bg-muted/40 rounded-lg px-3 py-2 min-w-[64px]">
      <div className="text-muted-foreground mb-0.5">{icon}</div>
      <span className="text-base font-bold leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

export default function CanvassingLeaderboard({ campaignId }) {
  // Fetch canvassing logs AND contact interactions to build comprehensive metrics
  const { data: leaderboard = [], isLoading, error, refetch } = useQuery({
    queryKey: ['canvassing-leaderboard', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const [logs, interactions, contacts] = await Promise.all([
          base44.entities.CanvassingLog.list('-created_date', 10000),
          base44.entities.ContactInteraction.list('-created_date', 10000),
          base44.entities.Contact.list('-created_date', 10000),
        ]);

        const filteredLogs = (Array.isArray(logs) ? logs : []).filter(l => l.campaign_id === campaignId);
        const allInteractions = Array.isArray(interactions) ? interactions : [];
        const allContacts = Array.isArray(contacts) ? contacts : [];

        // Build volunteer metrics
        const byVolunteer = {};

        // Aggregate from CanvassingLog
        filteredLogs.forEach(log => {
          const email = log.volunteer_email || log.volunteer_name || 'Unknown';
          if (!byVolunteer[email]) {
            byVolunteer[email] = {
              name: log.volunteer_name || email,
              email,
              doors_knocked: 0,
              positive_responses: 0,
              negative_responses: 0,
              no_answers: 0,
              undecided_count: 0,
              conversations: 0,
              successful_contacts: 0,
              sessions: 0,
            };
          }
          byVolunteer[email].doors_knocked += log.doors_knocked || 0;
          byVolunteer[email].positive_responses += log.positive_responses || 0;
          byVolunteer[email].negative_responses += log.negative_responses || 0;
          byVolunteer[email].no_answers += log.no_answers || 0;
          byVolunteer[email].undecided_count += log.undecided_count || 0;
          byVolunteer[email].sessions += 1;
        });

        // Add interaction data from ContactInteraction
        allInteractions.forEach(interaction => {
          const volunteer = allContacts.find(c => c.id === interaction.contact_id);
          const email = interaction.logged_by || 'Unknown';
          if (!byVolunteer[email]) {
            byVolunteer[email] = {
              name: email,
              email,
              doors_knocked: 0,
              positive_responses: 0,
              negative_responses: 0,
              no_answers: 0,
              undecided_count: 0,
              conversations: 0,
              successful_contacts: 0,
              sessions: 0,
            };
          }
          byVolunteer[email].conversations += 1;
          if (interaction.outcome === 'positive') {
            byVolunteer[email].successful_contacts += 1;
          }
        });

        // Calculate rankings by total score (doors + conversations weighted)
        return Object.values(byVolunteer)
          .map(v => ({
            ...v,
            total_score: (v.doors_knocked * 1) + (v.conversations * 1.5),
            positive_rate: v.doors_knocked > 0 ? Math.round((v.positive_responses / v.doors_knocked) * 100) : 0,
          }))
          .sort((a, b) => b.total_score - a.total_score);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 300000,
    refetchInterval: 300000,
  });

  const ranked = leaderboard || [];
  const activeCanvassers = ranked.length;
  const totalDoors = ranked.reduce((sum, v) => sum + (v.doors_knocked || 0), 0);
  const totalConversations = ranked.reduce((sum, v) => sum + (v.conversations || 0), 0);
  const totalSuccessful = ranked.reduce((sum, v) => sum + (v.successful_contacts || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Canvassers', value: activeCanvassers, icon: <Users className="w-4 h-4" /> },
          { label: 'Total Doors', value: totalDoors, icon: <DoorOpen className="w-4 h-4" /> },
          { label: 'Conversations', value: totalConversations, icon: <MessageSquare className="w-4 h-4" /> },
          { label: 'Successful', value: totalSuccessful, icon: <TrendingUp className="w-4 h-4" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="flex justify-center mb-1 text-primary">{icon}</div>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading feedback */}
      {isLoading && (
        <ProcessingFeedback
          label="Building leaderboard…"
          detail="Aggregating canvassing logs and voter interactions."
          tips={[
            'Volunteer rankings are based on doors knocked + conversations.',
            'Successful contacts are marked positive outcomes.',
            'Data refreshes every 5 minutes automatically.',
          ]}
        />
      )}

      {error && <DataFetchError error={error} onRetry={refetch} />}

      {!isLoading && ranked.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No interactions logged yet. Start canvassing to populate the leaderboard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ranked.map((canvasser, idx) => {
            const style = RANK_STYLES[idx] || { bg: 'bg-card border-border', badge: 'bg-muted text-muted-foreground', icon: <Star className="w-4 h-4 text-muted-foreground" /> };
            return (
              <div key={canvasser.email} className={`flex items-center gap-4 rounded-xl border p-4 ${style.bg}`}>
                {/* Rank badge */}
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  {style.icon}
                  <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>#{idx + 1}</span>
                </div>

                {/* Name + positive rate */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{canvasser.name}</p>
                  <p className="text-xs text-muted-foreground">{canvasser.positive_rate}% positive contact rate</p>
                </div>

                {/* Stats */}
                <div className="flex gap-2 flex-shrink-0 overflow-x-auto">
                  <StatPill icon={<DoorOpen className="w-3 h-3" />} value={canvasser.doors_knocked || 0} label="Doors" />
                  <StatPill icon={<MessageSquare className="w-3 h-3" />} value={canvasser.conversations || 0} label="Talks" />
                  <StatPill icon={<Target className="w-3 h-3" />} value={canvasser.successful_contacts || 0} label="Success" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}