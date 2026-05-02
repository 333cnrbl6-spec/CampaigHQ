import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Play, Trash2, TrendingUp, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useAuth } from '@/lib/AuthContext';
import DataFetchError from '@/components/DataFetchError';

export default function LoadTestDashboard() {
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const [volunteerCount, setVolunteerCount] = useState(100);
  const [logsPerVolunteer, setLogsPerVolunteer] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <DataFetchError title="Admin Access Required" error={{ message: 'Only admins can run load tests.' }} />
      </div>
    );
  }

  const runTest = async (action) => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('loadTestGenerator', {
        action,
        campaignId: campaign.id,
        volunteerCount: parseInt(volunteerCount),
        logsPerVolunteer: parseInt(logsPerVolunteer),
      });
      setResults(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Load Test Suite</h1>
          <p className="text-muted-foreground mt-2">
            Stress-test the system with simulated concurrent volunteers and API calls.
          </p>
        </div>

        <Tabs defaultValue="data-gen" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data-gen">Generate Data</TabsTrigger>
            <TabsTrigger value="stress-test">Stress Test</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Generate Test Data */}
          <TabsContent value="data-gen" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Test Volunteers & Logs</CardTitle>
                <CardDescription>Generate fake volunteers and canvassing logs for testing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Volunteers</label>
                    <Input
                      type="number"
                      value={volunteerCount}
                      onChange={e => setVolunteerCount(e.target.value)}
                      min="1"
                      max="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logs Per Volunteer</label>
                    <Input
                      type="number"
                      value={logsPerVolunteer}
                      onChange={e => setLogsPerVolunteer(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => runTest('generate_test_data')} disabled={isRunning} className="gap-2">
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Generating...' : 'Generate Test Data'}
                  </Button>
                  <Button onClick={() => runTest('cleanup_test_data')} disabled={isRunning} variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clean Up Test Data
                  </Button>
                </div>

                {results && results.volunteersCreated && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <p><strong>✓ Success</strong></p>
                        <p>Volunteers created: {results.volunteersCreated}</p>
                        <p>Logs created: {results.logsCreated}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stress Test */}
          <TabsContent value="stress-test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Run Stress Test</CardTitle>
                <CardDescription>Simulate concurrent API calls to measure system performance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 flex gap-3">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Test will simulate {volunteerCount} concurrent API calls.</p>
                    <p className="text-muted-foreground mt-1">Measures response time, throughput, and error rate.</p>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-3 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button onClick={() => runTest('stress_test')} disabled={isRunning} className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {isRunning ? 'Running Test...' : 'Start Stress Test'}
                </Button>

                {results && results.metrics && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Successful Requests</p>
                        <p className="text-3xl font-bold text-green-600">{results.metrics.success}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Failed Requests</p>
                        <p className="text-3xl font-bold text-destructive">{results.metrics.failed}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Total Duration</p>
                        <p className="text-3xl font-bold">{results.metrics.duration}ms</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Avg Response Time</p>
                        <p className="text-3xl font-bold">{results.metrics.avgResponseTime.toFixed(0)}ms</p>
                      </CardContent>
                    </Card>
                    <Card className="sm:col-span-2">
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Throughput</p>
                        <p className="text-3xl font-bold">{results.requestsPerSecond} req/s</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Summary */}
          <TabsContent value="results" className="space-y-6">
            {results ? (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <p className="text-muted-foreground">Run a test to see results here.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}