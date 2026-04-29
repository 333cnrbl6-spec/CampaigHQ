import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { Users, DoorOpen, ThumbsUp, ThumbsDown, MessageSquare, Newspaper, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RANGE_OPTIONS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'All Time', days: 999 },
];

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold font-heading">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function SessionSummaryDashboard() {
  const [rangeDays, setRangeDays] = useState(7);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['canvassing-logs'],
    queryFn: () => base44.entities.CanvassingLog.list('-session_date', 500),
  });

  const filtered = useMemo(() => {
    if (rangeDays === 999) return logs;
    const cutoff = subDays(new Date(), rangeDays);
    return logs.filter(l => {
      try { return parseISO(l.session_date) >= cutoff; } catch { return false; }
    });
  }, [logs, rangeDays]);

  const totals = useMemo(() => ({
    sessions: filtered.length,
    volunteers: new Set(filtered.map(l => l.volunteer_email || l.volunteer_name)).size,
    doors: filtered.reduce((s, l) => s + (l.doors_knocked || 0), 0),
    positive: filtered.reduce((s, l) => s + (l.positive_responses || 0), 0),
    negative: filtered.reduce((s, l) => s + (l.negative_responses || 0), 0),
    undecided: filtered.reduce((s, l) => s + (l.undecided_count || 0), 0),
    leaflets: filtered.reduce((s, l) => s + (l.leaflets_delivered || 0), 0),
    minutes: filtered.reduce((s, l) => s + (l.duration_minutes || 0), 0),
  }), [filtered]);

  // Daily chart data — last 7 or 14 days
  const chartData = useMemo(() => {
    const days = Math.min(rangeDays === 999 ? 14 : rangeDays, 14);
    return Array.from({ length: days }, (_, i) => {
      const d = subDays(new Date(), days - 1 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLogs = filtered.filter(l => l.session_date === dateStr);
      return {
        date: format(d, 'dd MMM'),
        doors: dayLogs.reduce((s, l) => s + (l.doors_knocked || 0), 0),
        positive: dayLogs.reduce((s, l) => s + (l.positive_responses || 0), 0),
      };
    });
  }, [filtered, rangeDays]);

  // Issues raised
  const issueNotes = useMemo(() =>
    filtered.filter(l => l.street_issues?.trim()).map(l => ({
      date: l.session_date,
      volunteer: l.volunteer_name,
      street: l.street_name,
      note: l.street_issues,
    })).slice(0, 20),
    [filtered]
  );

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  const contactRate = totals.doors > 0 ? Math.round(((totals.positive + totals.negative + totals.undecided) / totals.doors) * 100) : 0;
  const supportRate = (totals.positive + totals.negative) > 0 ? Math.round((totals.positive / (totals.positive + totals.negative)) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Range selector */}
      <div className="flex gap-2 flex-wrap">
        {RANGE_OPTIONS.map(({ label, days }) => (
          <button
            key={days}
            onClick={() => setRangeDays(days)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${rangeDays === days ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DoorOpen} label="Doors Knocked" value={totals.doors.toLocaleString()} sub={`${totals.sessions} sessions`} />
        <StatCard icon={Users} label="Volunteers Active" value={totals.volunteers} sub={`${totals.sessions} sessions logged`} />
        <StatCard icon={ThumbsUp} label="Positive Responses" value={totals.positive.toLocaleString()} sub={supportRate ? `${supportRate}% support rate` : undefined} color="text-green-600" />
        <StatCard icon={ThumbsDown} label="Negative Responses" value={totals.negative.toLocaleString()} sub={contactRate ? `${contactRate}% contact rate` : undefined} color="text-red-500" />
        <StatCard icon={MessageSquare} label="Undecided Voters" value={totals.undecided.toLocaleString()} sub="Potential to win over" color="text-amber-600" />
        <StatCard icon={Newspaper} label="Leaflets Delivered" value={totals.leaflets.toLocaleString()} />
        <StatCard icon={Clock} label="Hours Volunteered" value={Math.round(totals.minutes / 60)} sub={`${totals.minutes} minutes total`} />
        <StatCard icon={TrendingUp} label="Avg Doors / Session" value={totals.sessions ? Math.round(totals.doors / totals.sessions) : 0} sub="per session" />
      </div>

      {/* Chart */}
      {chartData.some(d => d.doors > 0) && (
        <div className="bg-card border border-border/60 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Doors Knocked Per Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="doors" name="Doors Knocked" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="positive" name="Positive" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60">
          <h3 className="font-semibold">Recent Sessions</h3>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-sm">No sessions logged in this period.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.slice(0, 15).map(log => (
              <div key={log.id} className="px-6 py-4 flex flex-wrap gap-x-6 gap-y-1 items-start">
                <div className="min-w-[140px]">
                  <p className="font-medium text-sm">{log.volunteer_name}</p>
                  <p className="text-xs text-muted-foreground">{log.session_date} {log.street_name ? `· ${log.street_name}` : ''}</p>
                </div>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-muted-foreground"><span className="font-semibold text-foreground">{log.doors_knocked}</span> doors</span>
                  <span className="text-green-600"><span className="font-semibold">{log.positive_responses || 0}</span> pos</span>
                  <span className="text-red-500"><span className="font-semibold">{log.negative_responses || 0}</span> neg</span>
                  <span className="text-amber-600"><span className="font-semibold">{log.undecided_count || 0}</span> undecided</span>
                  {log.leaflets_delivered > 0 && <span className="text-muted-foreground"><span className="font-semibold">{log.leaflets_delivered}</span> leaflets</span>}
                </div>
                {log.general_notes && <p className="text-xs text-muted-foreground w-full italic">"{log.general_notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Street issues */}
      {issueNotes.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h3 className="font-semibold">Street Issues Raised by Residents</h3>
          </div>
          <div className="divide-y divide-border/40">
            {issueNotes.map((n, i) => (
              <div key={i} className="px-6 py-3">
                <div className="flex gap-2 text-xs text-muted-foreground mb-1">
                  <span>{n.date}</span>
                  {n.street && <><span>·</span><span>{n.street}</span></>}
                  <span>·</span><span>{n.volunteer}</span>
                </div>
                <p className="text-sm">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}