import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const SUPPORT_CONFIG = {
  strong_supporter: { label: 'Strong Supporter', color: '#1a7a4c' },
  leaning: { label: 'Leaning', color: '#4ade80' },
  undecided: { label: 'Undecided', color: '#f59e0b' },
  opposed: { label: 'Opposed', color: '#ef4444' },
  unknown: { label: 'Not Contacted', color: '#94a3b8' },
};

export default function SupportBreakdown({ contacts }) {
  const data = Object.entries(SUPPORT_CONFIG).map(([key, { label, color }]) => ({
    name: label,
    value: contacts?.filter(c => c.support_level === key).length || 0,
    color,
  })).filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
      <h3 className="font-heading text-lg font-semibold mb-4">Voter Support</h3>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts recorded yet.</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--card))"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}