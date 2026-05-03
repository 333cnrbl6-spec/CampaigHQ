import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';

export default function CanvassingProgressWidget({ logs, campaign, isLoading }) {
  const data = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    
    const totalDoors = logs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0);
    const targetDoors = campaign?.target_votes ? Math.ceil(campaign.target_votes * 0.8) : 200;
    
    return [
      {
        name: 'Canvassing Progress',
        'Doors Knocked': totalDoors,
        'Target': targetDoors,
        'Remaining': Math.max(0, targetDoors - totalDoors),
      }
    ];
  }, [logs, campaign?.target_votes]);

  const progress = useMemo(() => {
    if (data.length === 0) return 0;
    const knocked = data[0]['Doors Knocked'] || 0;
    const target = data[0]['Target'] || 1;
    return Math.min(100, (knocked / target) * 100);
  }, [data]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">Canvassing Progress</h3>
          <p className="text-sm text-muted-foreground">Doors knocked toward target</p>
        </div>

        {isLoading ? (
          <ProcessingFeedback
            label="Loading progress data…"
            detail="Aggregating door knock logs."
            tips={['Each log entry represents a canvassing session.', 'Progress updates in real-time as sessions are logged.']}
          />
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">No canvassing logs yet. Start logging sessions to see progress.</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{data[0]['Doors Knocked'] || 0} doors knocked</span>
                <span className="text-muted-foreground">{Math.round(progress)}% of {data[0]['Target'] || 0} target</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary rounded-full h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Legend />
                <Bar dataKey="Doors Knocked" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Target" fill="hsl(var(--muted))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}