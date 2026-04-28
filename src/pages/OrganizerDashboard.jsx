import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MessageSquare, Target, Map } from 'lucide-react';
import { format, subDays } from 'date-fns';
import CanvassingCoverageMap from '@/components/organizer/CanvassingCoverageMap';

const SUPPORT_COLORS = {
  strong_supporter: '#10b981',
  leaning: '#3b82f6',
  undecided: '#f59e0b',
  opposed: '#ef4444',
  unknown: '#9ca3af'
};

export default function OrganizerDashboard() {
  // Fetch all interactions (doors knocked)
  const { data: allInteractions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ['all_interactions'],
    queryFn: () => base44.entities.ContactInteraction.list('-date', 1000),
    initialData: [],
  });

  // Fetch all contacts for support level breakdown
  const { data: allContacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['all_contacts'],
    queryFn: () => base44.entities.Contact.list('-updated_date', 1000),
    initialData: [],
  });

  // Calculate total doors knocked
  const totalDoorsKnocked = allInteractions.length;

  // Support level breakdown
  const supportBreakdown = useMemo(() => {
    const breakdown = {
      strong_supporter: 0,
      leaning: 0,
      undecided: 0,
      opposed: 0,
      unknown: 0,
    };
    
    allContacts.forEach(contact => {
      const level = contact.support_level || 'unknown';
      if (level in breakdown) breakdown[level]++;
    });

    return Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => ({
        name: level.replace('_', ' ').charAt(0).toUpperCase() + level.slice(1).replace('_', ' '),
        value: count,
        level,
      }));
  }, [allContacts]);

  // Recent interaction trends (last 7 days)
  const trendData = useMemo(() => {
    const today = new Date();
    const trends = {};

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'MMM d');
      trends[dateStr] = 0;
    }

    allInteractions.forEach(interaction => {
      if (interaction.date) {
        const dateObj = new Date(interaction.date);
        const dateStr = format(dateObj, 'MMM d');
        if (dateStr in trends) trends[dateStr]++;
      }
    });

    return Object.entries(trends).map(([date, count]) => ({
      date,
      interactions: count,
    }));
  }, [allInteractions]);

  // Interaction outcomes breakdown
  const outcomeBreakdown = useMemo(() => {
    const outcomes = { positive: 0, neutral: 0, negative: 0, no_answer: 0 };
    
    allInteractions.forEach(interaction => {
      const outcome = interaction.outcome || 'no_answer';
      if (outcome in outcomes) outcomes[outcome]++;
    });

    return Object.entries(outcomes)
      .filter(([_, count]) => count > 0)
      .map(([outcome, count]) => ({
        name: outcome.replace('_', ' ').charAt(0).toUpperCase() + outcome.slice(1).replace('_', ' '),
        value: count,
      }));
  }, [allInteractions]);

  // Calculate canvassed percentage
  const canvassedCount = allContacts.filter(c => c.canvassed).length;
  const canvassedPercentage = allContacts.length > 0 ? Math.round((canvassedCount / allContacts.length) * 100) : 0;

  const isLoading = loadingInteractions || loadingContacts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Campaign Overview</h1>
        <p className="text-muted-foreground">Real-time summary of canvassing progress and voter sentiment</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Doors Knocked</p>
                <p className="text-3xl font-bold">{totalDoorsKnocked}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contacts Canvassed</p>
                <p className="text-3xl font-bold">{canvassedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">{canvassedPercentage}% of total</p>
              </div>
              <Target className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Strong Supporters</p>
                <p className="text-3xl font-bold">{supportBreakdown.find(s => s.level === 'strong_supporter')?.value || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Contacts</p>
                <p className="text-3xl font-bold">{allContacts.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Map */}
       <Card className="mb-8">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Map className="w-5 h-5" />
             Geographic Coverage Map
           </CardTitle>
           <p className="text-sm text-muted-foreground mt-2">Green zones show canvassed areas. Red zones are priority targets. Larger circles indicate higher household density.</p>
         </CardHeader>
         <CardContent>
           <CanvassingCoverageMap contacts={allContacts} />
         </CardContent>
       </Card>

       {/* Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Support Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Support Level Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {supportBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={supportBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {supportBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUPPORT_COLORS[entry.level]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Interaction Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Interaction Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            {outcomeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={outcomeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interaction Trend */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Interaction Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.some(d => d.interactions > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="interactions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Doors Knocked"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No activity in the last 7 days</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}