import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react';

const SUPPORT_CONFIG = {
  strong_supporter: { label: 'Strong Supporter', color: '#16a34a' },
  leaning:          { label: 'Leaning',           color: '#86efac' },
  undecided:        { label: 'Undecided',          color: '#f59e0b' },
  opposed:          { label: 'Opposed',            color: '#ef4444' },
  unknown:          { label: 'Unknown',            color: '#cbd5e1' },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground">{value} contacts ({(percent * 100).toFixed(1)}%)</p>
    </div>
  );
};

export default function SupportAnalytics({ contacts }) {
  const [showAll, setShowAll] = useState(false);

  const pieData = useMemo(() => {
    const counts = {};
    for (const c of contacts) {
      const key = c.support_level || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(SUPPORT_CONFIG)
      .map(([key, cfg]) => ({ name: cfg.label, value: counts[key] || 0, color: cfg.color, key }))
      .filter(d => d.value > 0);
  }, [contacts]);

  // Hotspots: group by turf tag, count undecided per zone
  const hotspots = useMemo(() => {
    const zones = {};
    for (const c of contacts) {
      const tags = c.tags?.length ? c.tags : ['Untagged'];
      for (const tag of tags) {
        if (!zones[tag]) zones[tag] = { total: 0, undecided: 0, supporters: 0 };
        zones[tag].total++;
        if (c.support_level === 'undecided') zones[tag].undecided++;
        if (['strong_supporter', 'leaning'].includes(c.support_level)) zones[tag].supporters++;
      }
    }
    return Object.entries(zones)
      .map(([zone, stats]) => ({
        zone,
        ...stats,
        undecidedPct: stats.total > 0 ? Math.round((stats.undecided / stats.total) * 100) : 0,
        supportPct: stats.total > 0 ? Math.round((stats.supporters / stats.total) * 100) : 0,
      }))
      .filter(z => z.undecided > 0)
      .sort((a, b) => b.undecided - a.undecided);
  }, [contacts]);

  const visibleHotspots = showAll ? hotspots : hotspots.slice(0, 5);
  const undecidedTotal = contacts.filter(c => c.support_level === 'undecided').length;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Voter Support Analysis</h3>
        <span className="text-xs text-muted-foreground">{contacts.length.toLocaleString()} contacts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Support Level Breakdown</p>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Summary pills */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map(d => (
              <div key={d.key} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground truncate">{d.name}</span>
                <span className="font-semibold ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot panel */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Undecided Hotspots
              {undecidedTotal > 0 && <span className="ml-1 text-amber-600 font-semibold">({undecidedTotal} total)</span>}
            </p>
          </div>

          {hotspots.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <TrendingUp className="w-4 h-4 text-green-500" />
              No undecided voters tracked yet
            </div>
          ) : (
            <div className="space-y-2">
              {visibleHotspots.map((h, idx) => (
                <div key={h.zone} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
                  {/* Rank */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-amber-400 text-white' :
                    idx === 2 ? 'bg-amber-300 text-amber-900' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.zone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Undecided bar */}
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-amber-400 transition-all"
                          style={{ width: `${h.undecidedPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-amber-600 font-semibold flex-shrink-0">{h.undecidedPct}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-amber-600">{h.undecided}</p>
                    <p className="text-xs text-muted-foreground">of {h.total}</p>
                  </div>
                </div>
              ))}

              {hotspots.length > 5 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="w-full text-xs text-primary hover:underline flex items-center justify-center gap-1 pt-1"
                >
                  {showAll ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show {hotspots.length - 5} more zones</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}