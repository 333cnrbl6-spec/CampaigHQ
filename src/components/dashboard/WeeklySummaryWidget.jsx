import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Mail, Loader2 } from 'lucide-react';

export default function WeeklySummaryWidget({ logs, contacts }) {
  const [generating, setGenerating] = useState(false);

  // Calculate this week's metrics
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyLogs = logs.filter(log => {
    const logDate = new Date(log.session_date);
    return logDate >= weekAgo && logDate <= today;
  });

  const totalDoors = weeklyLogs.reduce((sum, l) => sum + (l.doors_knocked || 0), 0);
  const totalPositive = weeklyLogs.reduce((sum, l) => sum + (l.positive_responses || 0), 0);
  const responseRate = totalDoors > 0 ? Math.round((totalPositive / totalDoors) * 100) : 0;

  const supportBreakdown = [
    { name: 'Strong Supporters', value: contacts.filter(c => c.support_level === 'strong_supporter').length },
    { name: 'Leaning', value: contacts.filter(c => c.support_level === 'leaning').length },
    { name: 'Undecided', value: contacts.filter(c => c.support_level === 'undecided').length },
    { name: 'Opposed', value: contacts.filter(c => c.support_level === 'opposed').length },
  ];

  const colors = ['#2d5016', '#6ba83a', '#ffc107', '#ff6b6b'];

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      await base44.functions.invoke('generateWeeklySummary', {});
      alert('Weekly summary generated and emailed to organizers!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{totalDoors}</div>
            <p className="text-sm text-muted-foreground mt-1">Doors Knocked This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{responseRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">Response Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{weeklyLogs.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Canvassing Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Chart */}
      {supportBreakdown.some(s => s.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={supportBreakdown.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {colors.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} contacts`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Generate Summary Button */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Weekly Summary Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate and email a comprehensive summary of canvassing progress, sentiment trends, and coverage gaps to all campaign organizers.
          </p>
          <Button
            onClick={handleGenerateSummary}
            disabled={generating}
            className="w-full gap-2"
            variant="default"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Generate & Email Summary
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}