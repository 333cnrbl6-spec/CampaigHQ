import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function VolunteerPerformance() {
  const [weekData, setWeekData] = useState(null);
  const [topVolunteers, setTopVolunteers] = useState([]);

  const { data: canvassingLogs = [], isLoading } = useQuery({
    queryKey: ['canvassingLogs'],
    queryFn: () => base44.entities.CanvassingLog.list('-session_date', 500),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['contactInteractions'],
    queryFn: () => base44.entities.ContactInteraction.list('-date', 1000),
  });

  useEffect(() => {
    if (canvassingLogs.length === 0) return;

    // Get data from last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentLogs = canvassingLogs.filter(log => {
      const logDate = new Date(log.session_date);
      return logDate >= sevenDaysAgo;
    });

    // Group by volunteer and date
    const volunteerStats = {};
    const dailyStats = {};

    recentLogs.forEach(log => {
      const volunteer = log.volunteer_name || 'Unknown';
      const date = new Date(log.session_date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
      
      if (!volunteerStats[volunteer]) {
        volunteerStats[volunteer] = {
          name: volunteer,
          contacts: 0,
          positive: 0,
          negative: 0,
          undecided: 0,
          hours: 0,
          sessions: 0,
        };
      }

      volunteerStats[volunteer].contacts += log.doors_knocked || 0;
      volunteerStats[volunteer].positive += log.positive_responses || 0;
      volunteerStats[volunteer].negative += log.negative_responses || 0;
      volunteerStats[volunteer].undecided += log.undecided_count || 0;
      volunteerStats[volunteer].hours += (log.duration_minutes || 0) / 60;
      volunteerStats[volunteer].sessions += 1;

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          contacts: 0,
          positive: 0,
          negative: 0,
          hours: 0,
        };
      }
      
      dailyStats[date].contacts += log.doors_knocked || 0;
      dailyStats[date].positive += log.positive_responses || 0;
      dailyStats[date].negative += log.negative_responses || 0;
      dailyStats[date].hours += (log.duration_minutes || 0) / 60;
    });

    setTopVolunteers(
      Object.values(volunteerStats)
        .sort((a, b) => b.contacts - a.contacts)
        .slice(0, 10)
    );

    setWeekData({
      daily: Object.values(dailyStats),
      volunteers: volunteerStats,
      totals: {
        contacts: recentLogs.reduce((sum, log) => sum + (log.doors_knocked || 0), 0),
        positive: recentLogs.reduce((sum, log) => sum + (log.positive_responses || 0), 0),
        negative: recentLogs.reduce((sum, log) => sum + (log.negative_responses || 0), 0),
        undecided: recentLogs.reduce((sum, log) => sum + (log.undecided_count || 0), 0),
        hours: recentLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60,
      },
    });
  }, [canvassingLogs]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
        <h1 className="font-heading text-3xl font-bold mb-2">Volunteer Performance</h1>
        <p className="text-muted-foreground">No canvassing data available for the past week.</p>
      </div>
    );
  }

  const successRate = weekData.totals.contacts > 0 
    ? Math.round((weekData.totals.positive / weekData.totals.contacts) * 100) 
    : 0;

  const responseData = [
    { name: 'Positive', value: weekData.totals.positive, color: '#16a34a' },
    { name: 'Undecided', value: weekData.totals.undecided, color: '#ca8a04' },
    { name: 'Negative', value: weekData.totals.negative, color: '#dc2626' },
  ];

  const volunteerContactData = topVolunteers.map(v => ({
    name: v.name.split(' ')[0],
    contacts: v.contacts,
    positive: v.positive,
  }));

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Volunteer Performance</h1>
        <p className="text-muted-foreground mt-1">Last 7 days canvassing analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weekData.totals.contacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">doors knocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{weekData.totals.positive} positive responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canvassing Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{weekData.totals.hours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">active hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(weekData.totals.hours * 60 / weekData.totals.contacts).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">minutes per door</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Contacts Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Contacts</CardTitle>
            <CardDescription>Contacts made per day this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weekData.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="contacts" stroke="#16a34a" strokeWidth={2} name="Contacts" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Response Breakdown</CardTitle>
            <CardDescription>Support level distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={responseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name} ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {responseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Volunteers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Volunteers</CardTitle>
          <CardDescription>Ranked by contacts made this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={volunteerContactData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="contacts" fill="#2563eb" name="Total Contacts" />
              <Bar dataKey="positive" fill="#16a34a" name="Positive Responses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}