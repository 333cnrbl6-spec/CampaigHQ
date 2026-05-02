import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, FileText, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import DataFetchError from '@/components/DataFetchError';

export default function NationalReporting() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await base44.functions.invoke('getNationalMetrics', {});
        setMetrics(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <DataFetchError title="Admin Access Required" error={{ message: 'Only admins can view national reporting.' }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8">
        <DataFetchError error={{ message: error }} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const m = metrics.nationalMetrics;
  const pieData = [
    { name: 'Strong Supporter', value: metrics.supportBreakdown.strong_supporter },
    { name: 'Leaning', value: metrics.supportBreakdown.leaning },
    { name: 'Undecided', value: metrics.supportBreakdown.undecided },
    { name: 'Opposed', value: metrics.supportBreakdown.opposed },
  ];
  const pieColors = ['#00B140', '#85D65E', '#FFC107', '#FF5252'];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">National Reporting</h1>
            <p className="text-muted-foreground mt-2">Executive overview across all campaigns</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Active Campaigns</p>
                <p className="text-3xl font-bold">{m.activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">{m.totalCampaigns} total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Contacts</p>
                <p className="text-3xl font-bold">{m.totalContacts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{m.canvassedContacts.toLocaleString()} canvassed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Canvassing Progress</p>
                <p className="text-3xl font-bold">{m.canvassingRate}%</p>
                <div className="bg-secondary rounded-full h-1.5 mt-3">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${m.canvassingRate}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Positive Rate</p>
                <p className="text-3xl font-bold">{m.positiveRate}%</p>
                <p className="text-xs text-muted-foreground">{m.totalPositiveResponses.toLocaleString()} positive</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">By Campaign</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Support Breakdown</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Doors Knocked</span>
                    <span className="font-semibold">{m.totalDoorsKnocked.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Leaflets Delivered</span>
                    <span className="font-semibold">{m.totalLeafletsDelivered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Average per Campaign</span>
                    <span className="font-semibold">
                      {(m.totalDoorsKnocked / Math.max(m.activeCampaigns, 1)).toFixed(0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active</span>
                      <Badge variant="default">{m.activeCampaigns}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed</span>
                      <Badge variant="secondary">{m.totalCampaigns - m.activeCampaigns}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* By Campaign */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Performance</CardTitle>
                <CardDescription>Ranked by canvassing progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.campaignMetrics.map((campaign, idx) => (
                    <div key={campaign.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.candidate} • {campaign.constituency}
                          </p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                        <div>
                          <p className="text-muted-foreground">Contacts</p>
                          <p className="font-semibold">{campaign.contactCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Canvassed</p>
                          <p className="font-semibold">{campaign.canvassedCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Doors</p>
                          <p className="font-semibold">{campaign.doorsKnocked}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Leaflets</p>
                          <p className="font-semibold">{campaign.leafletsDelivered}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${campaign.canvassingProgress}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{campaign.canvassingProgress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">7-Day Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.trend7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="doorsKnocked" stroke="#00B140" strokeWidth={2} />
                    <Line type="monotone" dataKey="leafletsDelivered" stroke="#FFC107" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Breakdown */}
          <TabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Voter Support Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={120} fill="#8884d8" dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}