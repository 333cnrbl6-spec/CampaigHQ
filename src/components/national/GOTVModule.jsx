import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, MessageSquare, Zap, Users, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

const mockPollingStations = [
  {
    id: 'ps-1',
    name: 'Tyldesley Town Hall',
    postcode: 'WN10 8HE',
    area: 'Tyldesley',
    votersRegistered: 2840,
    votersExpected: 1900,
    votersTurned: 1245,
    queue: 15,
    status: 'busy',
    turnoutPercent: 65,
    lastUpdated: '14:35',
  },
  {
    id: 'ps-2',
    name: 'Astley Community Centre',
    postcode: 'M29 7PG',
    area: 'Astley',
    votersRegistered: 1840,
    votersExpected: 1200,
    votersTurned: 892,
    queue: 8,
    status: 'moderate',
    turnoutPercent: 74,
    lastUpdated: '14:33',
  },
  {
    id: 'ps-3',
    name: 'Mosley Common Primary',
    postcode: 'M26 3NH',
    area: 'Mosley Common',
    votersRegistered: 1560,
    votersExpected: 1000,
    votersTurned: 756,
    queue: 3,
    status: 'quiet',
    turnoutPercent: 76,
    lastUpdated: '14:30',
  },
];

const reminderTemplates = [
  {
    id: 'rem-1',
    title: 'Morning Reminder',
    channel: 'SMS',
    body: 'Good morning! Polling day is TODAY. Your polling station is {{station}}. Voting is open 7am-10pm. Get out and vote Green! 🟢',
    targetGroup: 'All supporters',
    scheduledTime: '08:00',
    status: 'sent',
    sent: 1840,
    failed: 12,
  },
  {
    id: 'rem-2',
    title: 'Midday Boost',
    channel: 'Email',
    body: 'It\'s midday! Over {{count}} of your neighbors have already voted. Don\'t miss out—voting closes at 10pm.',
    targetGroup: 'Undecided voters',
    scheduledTime: '12:00',
    status: 'sent',
    sent: 2156,
    failed: 45,
  },
  {
    id: 'rem-3',
    title: 'Final Push',
    channel: 'SMS',
    body: 'Final push! Only {{hours}} hours left to vote. Your local polling station: {{station}}. Vote Green for a sustainable future! 🟢',
    targetGroup: 'Supporters',
    scheduledTime: '20:00',
    status: 'scheduled',
    sent: 0,
    failed: 0,
  },
  {
    id: 'rem-4',
    title: 'Young Voter Reminder',
    channel: 'Email',
    body: 'First time voting? We\'ve got you. Your polling station is {{station}}. You just need your polling card or ID. Vote Green!',
    targetGroup: 'First-time voters (18-25)',
    scheduledTime: '10:30',
    status: 'sent',
    sent: 340,
    failed: 5,
  },
];

const getTurnoutColor = percent => {
  if (percent >= 70) return 'text-green-600 bg-green-100';
  if (percent >= 50) return 'text-blue-600 bg-blue-100';
  return 'text-amber-600 bg-amber-100';
};

const getQueueColor = queue => {
  if (queue < 5) return 'text-green-600 bg-green-100';
  if (queue < 15) return 'text-amber-600 bg-amber-100';
  return 'text-red-600 bg-red-100';
};

export default function GOTVModule() {
  const [activeTab, setActiveTab] = useState('stations');
  const [pollStats, setPollStats] = useState({
    totalRegistered: 6240,
    totalExpected: 4100,
    totalTurned: 2893,
    turnoutPercent: 71,
    estimatedFinal: 3200,
    estimatedGreenVotes: 1024,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPollStats(prev => ({
        ...prev,
        totalTurned: prev.totalTurned + Math.floor(Math.random() * 8),
        turnoutPercent: Math.round(
          ((prev.totalTurned + Math.floor(Math.random() * 8)) / prev.totalRegistered) * 100
        ),
      }));
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const remainingHours = Math.max(0, 10 - new Date().getHours());
  const estimatedRemaining = pollStats.totalExpected - pollStats.totalTurned;

  return (
    <div className="space-y-6">
      {/* Election Day Banner */}
      <div className="bg-gradient-to-r from-primary/15 to-accent/15 p-4 rounded-lg border border-primary/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <p className="font-bold text-primary">🗳️ ELECTION DAY: 7 May 2026</p>
            <p className="text-sm text-muted-foreground">
              Polling stations open: 7:00 AM – 10:00 PM | {remainingHours} hours remaining
            </p>
          </div>
        </div>
        <Badge className="bg-primary text-white animate-pulse">LIVE</Badge>
      </div>

      {/* Turnout Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Current Turnout</p>
              <p className="text-4xl font-bold text-green-600">{pollStats.turnoutPercent}%</p>
              <p className="text-xs text-green-600">
                {pollStats.totalTurned.toLocaleString()} / {pollStats.totalRegistered.toLocaleString()} voted
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700">Projected Final Turnout</p>
              <p className="text-4xl font-bold text-blue-600">{Math.round((pollStats.estimatedFinal / pollStats.totalRegistered) * 100)}%</p>
              <p className="text-xs text-blue-600">
                ~{pollStats.estimatedFinal.toLocaleString()} expected voters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-700">Estimated Green Votes</p>
              <p className="text-4xl font-bold text-purple-600">~{pollStats.estimatedGreenVotes.toLocaleString()}</p>
              <p className="text-xs text-purple-600">
                Based on {Math.round((pollStats.estimatedGreenVotes / pollStats.estimatedFinal) * 100)}% conversion rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3">
        {[
          { id: 'stations', label: '🗳️ Polling Stations', icon: Target },
          { id: 'reminders', label: '📱 GOTV Reminders', icon: MessageSquare },
          { id: 'turnout', label: '📊 Turnout Prediction', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Polling Stations */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Polling Station Status
              </CardTitle>
              <CardDescription>Real-time updates from all polling stations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPollingStations.map(station => (
                <div
                  key={station.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold">{station.name}</p>
                      <p className="text-sm text-muted-foreground">{station.postcode} • {station.area}</p>
                    </div>
                    <Badge
                      className={
                        station.status === 'busy'
                          ? 'bg-red-600'
                          : station.status === 'moderate'
                            ? 'bg-amber-600'
                            : 'bg-green-600'
                      }
                    >
                      {station.status === 'busy' ? '🔴 Busy' : station.status === 'moderate' ? '🟡 Moderate' : '🟢 Quiet'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-5 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Registered</p>
                      <p className="font-bold">{station.votersRegistered}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Voted</p>
                      <p className="font-bold text-green-600">{station.votersTurned}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Turnout</p>
                      <Badge className={getTurnoutColor(station.turnoutPercent)}>
                        {station.turnoutPercent}%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Queue</p>
                      <Badge className={getQueueColor(station.queue)}>
                        {station.queue} min
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-bold text-xs">{station.lastUpdated}</p>
                    </div>
                  </div>

                  {/* Turnout Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Turnout Progress</span>
                      <span className="font-medium">
                        {station.votersTurned} / {station.votersExpected}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{ width: `${(station.votersTurned / station.votersExpected) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Turnout Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Station Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  type: 'warning',
                  message: '⚠️ Tyldesley Town Hall: Long queue (15 mins). Send supporters to Astley.',
                },
                {
                  type: 'success',
                  message: '✓ Mosley Common: Quiet station. Good for final push at 4pm.',
                },
                {
                  type: 'info',
                  message: 'ℹ️ Astley Community Centre: Leading in turnout (74%). Momentum excellent.',
                },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : alert.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* GOTV Reminders */}
      {activeTab === 'reminders' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              GOTV Reminder Campaigns
            </CardTitle>
            <CardDescription>Automated voter outreach throughout election day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reminderTemplates.map(reminder => (
              <div key={reminder.id} className="p-4 border rounded-lg bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-bold">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {reminder.channel} • {reminder.targetGroup}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        reminder.status === 'sent'
                          ? 'bg-green-600 text-white'
                          : reminder.status === 'scheduled'
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted'
                      }
                    >
                      {reminder.status === 'sent' ? '✓ Sent' : reminder.status === 'scheduled' ? '⏱️ Scheduled' : 'Draft'}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm bg-muted/50 p-3 rounded mb-3 italic">"{reminder.body}"</p>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Scheduled Time</p>
                    <p className="font-bold">{reminder.scheduledTime}</p>
                  </div>
                  {reminder.status === 'sent' && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Delivered</p>
                        <p className="font-bold text-green-600">{reminder.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-bold text-red-600">{reminder.failed}</p>
                      </div>
                    </>
                  )}
                  {reminder.status === 'scheduled' && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Estimated Recipients</p>
                      <p className="font-bold">~2,500 supporters (pending final count)</p>
                    </div>
                  )}
                </div>

                {reminder.status === 'sent' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Delivery Rate</span>
                      <span className="font-medium">
                        {Math.round((reminder.sent / (reminder.sent + reminder.failed)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{
                          width: `${(reminder.sent / (reminder.sent + reminder.failed)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button className="w-full gap-2 mt-4">
              <MessageSquare className="w-4 h-4" />
              Create New Reminder
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Turnout Prediction */}
      {activeTab === 'turnout' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Turnout Prediction Model
              </CardTitle>
              <CardDescription>AI-powered forecast based on 2:35 PM data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Turnout Forecast */}
              <div>
                <h3 className="font-bold mb-4">Final Turnout Forecast</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Conservative Estimate (Low)</p>
                      <Badge variant="outline">2,800 voters (45%)</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-45" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assumes no further reminders, current pace continues
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Base Case (Expected)</p>
                      <Badge className="bg-green-600">3,200 voters (51%)</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 w-51" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      With GOTV reminders and final push at 6-10pm
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Optimistic (High)</p>
                      <Badge variant="outline">3,600 voters (58%)</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 w-58" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      With aggressive volunteer push in final 2 hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Green Vote Projection */}
              <div>
                <h3 className="font-bold mb-4">Green Party Vote Projection</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-green-700">
                    Based on base case turnout of 3,200 voters and 32% expected Green conversion rate:
                  </p>
                  <p className="text-3xl font-bold text-green-600">~1,024 Green votes</p>
                  <p className="text-sm text-green-600">
                    Previous election: 847 votes | Target: 1,200 votes | Gap: 176 votes needed
                  </p>
                </div>
              </div>

              {/* Key Factors */}
              <div>
                <h3 className="font-bold mb-3">Prediction Factors</h3>
                <div className="space-y-2">
                  {[
                    {
                      factor: 'Current Turnout Rate',
                      value: '71%',
                      impact: 'Positive',
                    },
                    {
                      factor: 'Weather Conditions',
                      value: 'Dry, 18°C',
                      impact: 'Positive',
                    },
                    {
                      factor: 'Weekday Timing',
                      value: 'Wednesday',
                      impact: 'Neutral',
                    },
                    {
                      factor: 'Polling Station Queues',
                      value: 'Low-Moderate',
                      impact: 'Positive',
                    },
                    {
                      factor: 'GOTV Campaign Intensity',
                      value: 'High (4 reminders sent)',
                      impact: 'Positive',
                    },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                      <p className="font-medium text-sm">{row.factor}</p>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">{row.value}</p>
                        <Badge
                          className={
                            row.impact === 'Positive'
                              ? 'bg-green-100 text-green-700'
                              : row.impact === 'Negative'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {row.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="font-bold text-accent-foreground mb-2">📋 Recommendations for Final Push</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Send final SMS reminder at 8pm (1,840 supporters)</li>
                  <li>✓ Deploy 3-4 volunteers to Tyldesley between 7-9pm</li>
                  <li>✓ Monitor Mosley Common—lowest queue, best for last-minute voters</li>
                  <li>✓ Prepare victory messaging (targeting 1,024+ Green votes)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}