import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const LEVELS = [
  { key: 'strong_supporter', label: 'Strong Supporter', color: '#16a34a' },
  { key: 'leaning',          label: 'Leaning',          color: '#4ade80' },
  { key: 'undecided',        label: 'Undecided',        color: '#facc15' },
  { key: 'opposed',          label: 'Opposed',          color: '#ef4444' },
  { key: 'unknown',          label: 'Unknown',          color: '#94a3b8' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow text-xs">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground">{value} contacts</p>
    </div>
  );
};

export default function SupportLevelWidget({ contacts = [] }) {
  const counts = LEVELS.map(l => ({
    ...l,
    value: contacts.filter(c => (c.support_level || 'unknown') === l.key).length,
  })).filter(l => l.value > 0);

  const total = contacts.length;
  const canvassed = contacts.filter(c => c.canvassed).length;

  if (total === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex items-center justify-center min-h-[240px]">
        <p className="text-sm text-muted-foreground">No contact data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm col-span-1 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-lg font-semibold">Voter Support Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{canvassed} of {total} contacts canvassed</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          {LEVELS.filter(l => counts.find(c => c.key === l.key)).map(l => (
            <div key={l.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={counts}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {counts.map(entry => (
                  <Cell key={entry.key} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <p className="text-center -mt-2 text-2xl font-bold font-heading text-foreground">
            {Math.round(((counts.find(c => c.key === 'strong_supporter')?.value || 0) + (counts.find(c => c.key === 'leaning')?.value || 0)) / total * 100)}%
          </p>
          <p className="text-center text-xs text-muted-foreground">supporter rate</p>
        </div>

        {/* Bar Chart */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">Count by Level</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={counts} margin={{ top: 4, right: 8, left: -10, bottom: 4 }} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => v === 'Strong Supporter' ? 'Strong' : v} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Contacts" radius={[4, 4, 0, 0]}>
                {counts.map(entry => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50">
        {LEVELS.slice(0, 4).map(l => {
          const count = counts.find(c => c.key === l.key)?.value || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={l.key} className="rounded-xl p-3 text-center" style={{ backgroundColor: l.color + '18' }}>
              <p className="text-xl font-bold font-heading" style={{ color: l.color }}>{count}</p>
              <p className="text-xs font-medium text-foreground/80 mt-0.5">{l.label}</p>
              <p className="text-xs text-muted-foreground">{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}