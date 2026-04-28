import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, TrendingUp, Users, MessageSquare, DoorOpen } from 'lucide-react';

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

export default function Leaderboard() {
  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.ContactInteraction.list('-date', 1000),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-updated_date', 1000),
  });

  // Build leaderboard from logged_by on interactions
  const stats = {};
  interactions.forEach(i => {
    const key = i.logged_by || 'Unknown';
    if (!stats[key]) stats[key] = { name: key, total: 0, door_knocks: 0, calls: 0, positives: 0 };
    stats[key].total += 1;
    if (i.type === 'door_knock') stats[key].door_knocks += 1;
    if (i.type === 'phone_call') stats[key].calls += 1;
    if (i.outcome === 'positive') stats[key].positives += 1;
  });

  // Also count canvassed contacts by canvass_date (no logged_by on contacts, so use interactions only)
  const ranked = Object.values(stats).sort((a, b) => b.total - a.total);

  // Summary totals
  const totalInteractions = interactions.length;
  const totalDoors = interactions.filter(i => i.type === 'door_knock').length;
  const totalPositive = interactions.filter(i => i.outcome === 'positive').length;
  const activeCanvassers = ranked.length;

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" /> Canvasser Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">Ranked by total voter interactions logged</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Canvassers', value: activeCanvassers, icon: <Users className="w-4 h-4" /> },
          { label: 'Total Interactions', value: totalInteractions, icon: <MessageSquare className="w-4 h-4" /> },
          { label: 'Doors Knocked', value: totalDoors, icon: <DoorOpen className="w-4 h-4" /> },
          { label: 'Positive Outcomes', value: totalPositive, icon: <TrendingUp className="w-4 h-4" /> },
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

      {/* Ranked list */}
      {ranked.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No interactions logged yet. Start canvassing to see rankings!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ranked.map((canvasser, idx) => {
            const style = RANK_STYLES[idx] || { bg: 'bg-card border-border', badge: 'bg-muted text-muted-foreground', icon: <Star className="w-4 h-4 text-muted-foreground" /> };
            const persuasion = canvasser.total > 0 ? Math.round((canvasser.positives / canvasser.total) * 100) : 0;
            return (
              <div key={canvasser.name} className={`flex items-center gap-4 rounded-xl border p-4 ${style.bg}`}>
                {/* Rank */}
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                  {style.icon}
                  <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>#{idx + 1}</span>
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{canvasser.name}</p>
                  <p className="text-xs text-muted-foreground">{persuasion}% positive rate</p>
                </div>

                {/* Stats */}
                <div className="flex gap-2 flex-shrink-0">
                  <StatPill icon={<MessageSquare className="w-3 h-3" />} value={canvasser.total} label="Total" />
                  <StatPill icon={<DoorOpen className="w-3 h-3" />} value={canvasser.door_knocks} label="Doors" />
                  <StatPill icon={<TrendingUp className="w-3 h-3" />} value={canvasser.positives} label="Positive" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}