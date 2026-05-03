import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { Calendar, Users, TrendingUp, Target } from 'lucide-react';

export function ExecutiveSummaryTemplate({ contacts, interactions, events, campaign }) {
  const canvassedCount = contacts.filter(c => c.canvassed).length;
  const canvassPercent = contacts.length > 0 ? Math.round((canvassedCount / contacts.length) * 100) : 0;
  const strongSupporters = contacts.filter(c => c.support_level === 'strong_supporter').length;
  const volunteers = contacts.filter(c => c.volunteer).length;
  const completedEvents = events.filter(e => e.status === 'completed').length;

  return (
    <div className="space-y-6 page-break">
      <div className="bg-gradient-to-r from-primary to-accent text-white rounded-lg p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">{campaign?.name}</h1>
        <p className="text-lg opacity-90">{campaign?.constituency} • {campaign?.party || 'Campaign'}</p>
        <p className="text-sm opacity-75 mt-2">Report generated {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold text-primary">{canvassPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">Canvas Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">{strongSupporters}</div>
            <p className="text-xs text-muted-foreground mt-1">Strong Supporters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600">{volunteers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Volunteers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600">{completedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Events Completed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CanvassingProgressTemplate({ contacts }) {
  const canvassedCount = contacts.filter(c => c.canvassed).length;
  const canvassPercent = contacts.length > 0 ? Math.round((canvassedCount / contacts.length) * 100) : 0;

  const supportBreakdown = [
    { name: 'Strong Supporter', value: contacts.filter(c => c.support_level === 'strong_supporter').length, fill: '#16a34a' },
    { name: 'Leaning', value: contacts.filter(c => c.support_level === 'leaning').length, fill: '#3b82f6' },
    { name: 'Undecided', value: contacts.filter(c => c.support_level === 'undecided').length, fill: '#eab308' },
    { name: 'Opposed', value: contacts.filter(c => c.support_level === 'opposed').length, fill: '#ef4444' },
    { name: 'Unknown', value: contacts.filter(c => c.support_level === 'unknown').length, fill: '#9ca3af' }
  ];

  const canvassingProgress = [
    { status: 'Canvassed', count: canvassedCount, fill: '#16a34a' },
    { status: 'Not Canvassed', count: contacts.length - canvassedCount, fill: '#e5e7eb' }
  ];

  return (
    <Card className="page-break">
      <CardHeader>
        <CardTitle className="text-2xl">Canvassing Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/5 rounded-lg p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">{canvassPercent}%</div>
            <p className="text-lg text-muted-foreground">{canvassedCount} of {contacts.length} contacts canvassed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-4 text-center">Canvassing Status</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={canvassingProgress} cx="50%" cy="50%" outerRadius={80} dataKey="count" label>
                  {canvassingProgress.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-center">Support Breakdown (All)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={supportBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}` : ''}>
                  {supportBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VolunteerActivityTemplate({ contacts, interactions }) {
  const volunteers = contacts.filter(c => c.volunteer);
  const volunteerInteractions = volunteers.map(v => ({
    name: v.name,
    interactions: interactions.filter(i => i.logged_by === v.email).length,
    doorKnocks: interactions.filter(i => i.logged_by === v.email && i.type === 'door_knock').length,
  })).sort((a, b) => b.interactions - a.interactions);

  const topVolunteers = volunteerInteractions.slice(0, 10);

  return (
    <Card className="page-break">
      <CardHeader>
        <CardTitle className="text-2xl">Volunteer Activity Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600">{volunteers.length}</div>
            <p className="text-sm text-muted-foreground">Total Volunteers</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600">{interactions.length}</div>
            <p className="text-sm text-muted-foreground">Total Interactions Logged</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-600">{topVolunteers.length > 0 ? Math.round(interactions.length / volunteers.length) : 0}</div>
            <p className="text-sm text-muted-foreground">Avg. per Volunteer</p>
          </div>
        </div>

        {topVolunteers.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-base">Top 10 Volunteers by Activity</h4>
            <div className="space-y-2">
              {topVolunteers.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{idx + 1}. {v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.doorKnocks} door knocks</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{v.interactions}</div>
                    <p className="text-xs text-muted-foreground">interactions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topVolunteers.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topVolunteers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="interactions" fill="#16a34a" name="Total Interactions" />
              <Bar dataKey="doorKnocks" fill="#3b82f6" name="Door Knocks" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractionBreakdownTemplate({ interactions }) {
  const interactionsByType = [
    { name: 'Door Knock', value: interactions.filter(i => i.type === 'door_knock').length },
    { name: 'Phone Call', value: interactions.filter(i => i.type === 'phone_call').length },
    { name: 'Email', value: interactions.filter(i => i.type === 'email').length },
    { name: 'Text/SMS', value: interactions.filter(i => i.type === 'text').length },
    { name: 'Meeting', value: interactions.filter(i => i.type === 'meeting').length }
  ].filter(d => d.value > 0);

  const outcomeBreakdown = [
    { name: 'Positive', value: interactions.filter(i => i.outcome === 'positive').length, fill: '#16a34a' },
    { name: 'Neutral', value: interactions.filter(i => i.outcome === 'neutral').length, fill: '#eab308' },
    { name: 'Negative', value: interactions.filter(i => i.outcome === 'negative').length, fill: '#ef4444' },
    { name: 'No Answer', value: interactions.filter(i => i.outcome === 'no_answer').length, fill: '#9ca3af' }
  ].filter(d => d.value > 0);

  return (
    <Card className="page-break">
      <CardHeader>
        <CardTitle className="text-2xl">Interaction Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-4 text-center">Interaction Methods</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={interactionsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-center">Interaction Outcomes</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={outcomeBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => value > 0 ? `${name}` : ''}>
                  {outcomeBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}