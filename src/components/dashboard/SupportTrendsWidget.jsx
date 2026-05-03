import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';

const SUPPORT_COLORS = {
  strong_supporter: '#00612B',
  leaning: '#A8C423',
  undecided: '#9CA3AF',
  opposed: '#EF4444',
  unknown: '#D1D5DB',
};

export default function SupportTrendsWidget({ contacts, isLoading }) {
  const data = useMemo(() => {
    if (!Array.isArray(contacts)) return [];

    const supportCounts = {
      strong_supporter: 0,
      leaning: 0,
      undecided: 0,
      opposed: 0,
      unknown: 0,
    };

    contacts.forEach(contact => {
      const level = contact.support_level || 'unknown';
      if (supportCounts.hasOwnProperty(level)) {
        supportCounts[level] += 1;
      } else {
        supportCounts.unknown += 1;
      }
    });

    return [
      { name: 'Strong Supporters', value: supportCounts.strong_supporter, fill: SUPPORT_COLORS.strong_supporter },
      { name: 'Leaning', value: supportCounts.leaning, fill: SUPPORT_COLORS.leaning },
      { name: 'Undecided', value: supportCounts.undecided, fill: SUPPORT_COLORS.undecided },
      { name: 'Opposed', value: supportCounts.opposed, fill: SUPPORT_COLORS.opposed },
      { name: 'Unknown', value: supportCounts.unknown, fill: SUPPORT_COLORS.unknown },
    ].filter(item => item.value > 0);
  }, [contacts]);

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">Support Level Trends</h3>
          <p className="text-sm text-muted-foreground">Voter sentiment distribution</p>
        </div>

        {isLoading ? (
          <ProcessingFeedback
            label="Analyzing support levels…"
            detail="Categorizing voter contacts by support sentiment."
            tips={['Support levels are recorded during door knocks.', 'Use voter feedback to refine targeting strategy.']}
          />
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">No voter support data yet. Start logging door knock outcomes.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `${value} voters`}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend with counts */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>

            {total > 0 && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                Total voters tracked: {total}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}