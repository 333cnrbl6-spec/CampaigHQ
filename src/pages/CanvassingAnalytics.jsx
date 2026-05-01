import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Target, TrendingUp, MapPin, Award, CheckCircle2, Clock, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SUPPORT_COLORS = {
  strong_supporter: '#16a34a',
  leaning: '#65a30d',
  undecided: '#d97706',
  opposed: '#dc2626',
  unknown: '#94a3b8',
};

const SUPPORT_LABELS = {
  strong_supporter: 'Strong Support',
  leaning: 'Leaning',
  undecided: 'Undecided',
  opposed: 'Opposed',
  unknown: 'Unknown',
};

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-heading">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = '#16a34a', label, sublabel }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate max-w-[180px]">{label}</span>
        <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">{value}/{max} ({pct}%){sublabel ? ` · ${sublabel}` : ''}</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function CanvassingAnalytics() {
  const [turfFilter, setTurfFilter] = useState('all');

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['canvassing-logs'],
    queryFn: () => base44.entities.CanvassingLog.list('-session_date', 500),
  });

  // Derive turf zones from contact tags
  const allTurfs = useMemo(() =>
    [...new Set(contacts.flatMap(c => c.tags || []))].filter(Boolean).sort(),
    [contacts]
  );

  // Filter contacts by selected turf
  const filteredContacts = useMemo(() =>
    turfFilter === 'all' ? contacts : contacts.filter(c => (c.tags || []).includes(turfFilter)),
    [contacts, turfFilter]
  );

  // Per-turf stats
  const turfStats = useMemo(() => {
    return allTurfs.map(turf => {
      const inTurf = contacts.filter(c => (c.tags || []).includes(turf));
      const canvassed = inTurf.filter(c => c.canvassed).length;
      const supporters = inTurf.filter(c => ['strong_supporter', 'leaning'].includes(c.support_level)).length;
      const successRate = canvassed > 0 ? Math.round((supporters / canvassed) * 100) : 0;
      return { turf, total: inTurf.length, canvassed, supporters, successRate };
    }).sort((a, b) => b.total - a.total);
  }, [contacts, allTurfs]);

  // Support breakdown for selected filter
  const supportBreakdown = useMemo(() => {
    const counts = {};
    filteredContacts.forEach(c => {
      const lvl = c.support_level || 'unknown';
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: SUPPORT_LABELS[key] || key,
      value,
      color: SUPPORT_COLORS[key] || '#94a3b8',
    }));
  }, [filteredContacts]);

  // Volunteer productivity from CanvassingLogs
  const volunteerStats = useMemo(() => {
    const filtered = turfFilter === 'all' ? logs : logs.filter(l => l.turf_id || l.street_name);
    const byVol = {};
    filtered.forEach(log => {
      const name = log.volunteer_name || 'Unknown';
      if (!byVol[name]) byVol[name] = { name, sessions: 0, doors: 0, positive: 0 };
      byVol[name].sessions += 1;
      byVol[name].doors += log.doors_knocked || 0;
      byVol[name].positive += log.positive_responses || 0;
    });
    return Object.values(byVol)
      .sort((a, b) => b.doors - a.doors)
      .slice(0, 10);
  }, [logs, turfFilter]);

  // Monthly canvassing activity from logs
  const monthlyActivity = useMemo(() => {
    const byMonth = {};
    logs.forEach(log => {
      if (!log.session_date) return;
      const month = log.session_date.slice(0, 7); // YYYY-MM
      if (!byMonth[month]) byMonth[month] = { month, doors: 0, sessions: 0 };
      byMonth[month].doors += log.doors_knocked || 0;
      byMonth[month].sessions += 1;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [logs]);

  // Summary stats
  const totalCanvassed = filteredContacts.filter(c => c.canvassed).length;
  const totalSupporters = filteredContacts.filter(c => ['strong_supporter', 'leaning'].includes(c.support_level)).length;
  const successRate = totalCanvassed > 0 ? Math.round((totalSupporters / totalCanvassed) * 100) : 0;
  const totalDoors = logs.reduce((s, l) => s + (l.doors_knocked || 0), 0);

  const isLoading = loadingContacts;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Canvassing Analytics</h1>
          <p className="text-muted-foreground mt-1">Performance metrics by turf zone, support, and volunteer</p>
        </div>
        <Select value={turfFilter} onValueChange={setTurfFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by turf…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Turfs</SelectItem>
            {allTurfs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Contacts" value={filteredContacts.length.toLocaleString()} sub={turfFilter !== 'all' ? turfFilter : 'across all turfs'} color="blue" />
            <StatCard icon={CheckCircle2} label="Canvassed" value={totalCanvassed.toLocaleString()} sub={`${filteredContacts.length > 0 ? Math.round((totalCanvassed / filteredContacts.length) * 100) : 0}% coverage`} color="green" />
            <StatCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} sub="supporters / canvassed" color="primary" />
            <StatCard icon={MapPin} label="Doors Knocked" value={totalDoors.toLocaleString()} sub="from session logs" color="amber" />
          </div>

          {/* Turf Progress Bars */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-1">Contacts Canvassed per Turf</h2>
              <p className="text-xs text-muted-foreground mb-5">How many contacts have been visited in each zone</p>
              <div className="space-y-4">
                {turfStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No turf data available yet.</p>
                ) : turfStats.map(s => (
                  <ProgressBar
                    key={s.turf}
                    label={s.turf}
                    value={s.canvassed}
                    max={s.total}
                    color="#16a34a"
                  />
                ))}
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-1">Success Rate per Turf</h2>
              <p className="text-xs text-muted-foreground mb-5">Supporters + leaning as % of canvassed contacts</p>
              <div className="space-y-4">
                {turfStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No turf data available yet.</p>
                ) : turfStats.map(s => (
                  <ProgressBar
                    key={s.turf}
                    label={s.turf}
                    value={s.supporters}
                    max={s.canvassed || 1}
                    color="#2563eb"
                    sublabel={`${s.successRate}% positive`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Support Breakdown Pie */}
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-1">Support Level Breakdown</h2>
              <p className="text-xs text-muted-foreground mb-4">{turfFilter !== 'all' ? turfFilter : 'All contacts'}</p>
              {supportBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={supportBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                      {supportBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Monthly Activity Bar */}
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <h2 className="font-heading text-lg font-semibold mb-1">Monthly Doors Knocked</h2>
              <p className="text-xs text-muted-foreground mb-4">From canvassing session logs (last 6 months)</p>
              {monthlyActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No session logs recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyActivity} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="doors" name="Doors Knocked" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Volunteer Productivity Table */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">Volunteer Productivity</h2>
                <p className="text-xs text-muted-foreground">Ranked by total doors knocked (top 10)</p>
              </div>
            </div>
            {volunteerStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No canvassing sessions logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground w-8">#</th>
                      <th className="pb-3 font-medium text-muted-foreground">Volunteer</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Sessions</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Doors</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Positive</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Hit Rate</th>
                      <th className="pb-3 font-medium text-muted-foreground pl-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {volunteerStats.map((v, i) => {
                      const hitRate = v.doors > 0 ? Math.round((v.positive / v.doors) * 100) : 0;
                      const maxDoors = volunteerStats[0]?.doors || 1;
                      return (
                        <tr key={v.name} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                          <td className="py-3 font-medium">{v.name}</td>
                          <td className="py-3 text-right text-muted-foreground">{v.sessions}</td>
                          <td className="py-3 text-right font-semibold">{v.doors.toLocaleString()}</td>
                          <td className="py-3 text-right text-green-700">{v.positive.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            <span className={`font-medium ${hitRate >= 50 ? 'text-green-700' : hitRate >= 25 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {hitRate}%
                            </span>
                          </td>
                          <td className="py-3 pl-4 w-32">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((v.doors / maxDoors) * 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Turf Summary Table */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">Turf Zone Summary</h2>
                <p className="text-xs text-muted-foreground">Contact counts, canvassing coverage, and support rates</p>
              </div>
            </div>
            {turfStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No turf zones found. Assign contacts to turfs using tags.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Turf Zone</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Contacts</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Canvassed</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Coverage</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Supporters</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Success Rate</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {turfStats.map(s => {
                      const coverage = s.total > 0 ? Math.round((s.canvassed / s.total) * 100) : 0;
                      return (
                        <tr key={s.turf} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-medium">{s.turf}</td>
                          <td className="py-3 text-right">{s.total}</td>
                          <td className="py-3 text-right text-primary font-medium">{s.canvassed}</td>
                          <td className="py-3 text-right">
                            <span className={`font-medium ${coverage >= 75 ? 'text-green-700' : coverage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                              {coverage}%
                            </span>
                          </td>
                          <td className="py-3 text-right text-green-700">{s.supporters}</td>
                          <td className="py-3 text-right">
                            <span className={`font-medium ${s.successRate >= 50 ? 'text-green-700' : s.successRate >= 25 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {s.successRate}%
                            </span>
                          </td>
                          <td className="py-3 text-right text-muted-foreground">{s.total - s.canvassed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}