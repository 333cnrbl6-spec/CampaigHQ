import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Share2, Download, Trophy, Heart, MessageSquare, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const mockResults = {
  constituency: 'Tyldesley & Mosley Common',
  region: 'Greater Manchester',
  electionDate: '7 May 2026',
  status: 'declared',
  totalVotes: 3247,
  turnout: 52,
  seats: {
    green: {
      votes: 1024,
      percentage: 31.5,
      seats: 1,
      winner: true,
      candidate: 'Emma Thompson',
      majority: 127,
      status: 'elected',
    },
    labour: {
      votes: 897,
      percentage: 27.6,
      seats: 0,
      winner: false,
      candidate: 'James Mitchell',
      majority: null,
    },
    conservative: {
      votes: 756,
      percentage: 23.3,
      seats: 0,
      winner: false,
      candidate: 'Sarah Patel',
      majority: null,
    },
    libdem: {
      votes: 423,
      percentage: 13.0,
      seats: 0,
      winner: false,
      candidate: 'Michael Davies',
      majority: null,
    },
    reform: {
      votes: 147,
      percentage: 4.6,
      seats: 0,
      winner: false,
      candidate: 'David Wilson',
      majority: null,
    },
  },
  previousElection: {
    green: 847,
    labour: 1052,
    conservative: 891,
    libdem: 234,
  },
  swing: {
    labour: -155,
    conservative: -135,
    libdem: 189,
  },
};

const celebrationMessages = [
  '🟢 We won! Emma Thompson is your new MP!',
  '✓ 1,024 Green votes in Tyldesley & Mosley Common',
  '📈 21% increase from 2019 (847 → 1,024 votes)',
  '🌍 Green Party making a difference',
  '💚 Thank you to every volunteer and supporter',
  '🗳️ Democracy delivered!',
];

export default function ResultsVictoryPage() {
  const [activeView, setActiveView] = useState('results');
  const [celebrationIndex, setCelebrationIndex] = useState(0);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  // Trigger confetti on mount
  useEffect(() => {
    if (mockResults.seats.green.winner && !hasTriggeredConfetti) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00B140', '#FFD700', '#FFFFFF'],
        });
        setHasTriggeredConfetti(true);
      }, 500);
    }
  }, [hasTriggeredConfetti]);

  // Cycle celebration messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCelebrationIndex(prev => (prev + 1) % celebrationMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getPartyColor = party => {
    switch (party) {
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'labour':
        return 'text-red-600 bg-red-100';
      case 'conservative':
        return 'text-blue-600 bg-blue-100';
      case 'libdem':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getPartyBg = party => {
    switch (party) {
      case 'green':
        return 'bg-green-50';
      case 'labour':
        return 'bg-red-50';
      case 'conservative':
        return 'bg-blue-50';
      case 'libdem':
        return 'bg-orange-50';
      default:
        return 'bg-muted';
    }
  };

  const partyOrder = ['green', 'labour', 'conservative', 'libdem', 'reform'];

  return (
    <div className="space-y-6 pb-8">
      {/* Victory Banner */}
      {mockResults.seats.green.winner && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 rounded-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Trophy className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold opacity-90">🗳️ ELECTION RESULTS - 7 May 2026</p>
            <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-2">
              🟢 Emma Thompson Elected!
            </h1>
            <p className="text-lg opacity-95">
              Green Party wins Tyldesley & Mosley Common with 1,024 votes (31.5%)
            </p>

            {/* Celebration Message Carousel */}
            <div className="mt-6 p-4 bg-white/15 rounded-lg backdrop-blur">
              <p className="text-base font-medium animate-pulse">
                {celebrationMessages[celebrationIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3 overflow-x-auto">
        {[
          { id: 'results', label: '📊 Results', icon: TrendingUp },
          { id: 'breakdown', label: '📈 Vote Breakdown', icon: TrendingUp },
          { id: 'analysis', label: '🔍 Analysis', icon: TrendingUp },
          { id: 'share', label: '📢 Share Victory', icon: Share2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              activeView === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results View */}
      {activeView === 'results' && (
        <div className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Votes Cast</p>
                <p className="text-2xl font-bold">{mockResults.totalVotes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Constituency total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Turnout</p>
                <p className="text-2xl font-bold">{mockResults.turnout}%</p>
                <p className="text-xs text-muted-foreground mt-1">Eligible voters</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <p className="text-sm text-green-700">Green Votes</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockResults.seats.green.votes.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">31.5%</p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-100">
              <CardContent className="pt-6">
                <p className="text-sm text-green-700 font-bold">Winner</p>
                <p className="text-2xl font-bold text-green-600">✓ Won</p>
                <p className="text-xs text-green-600 mt-1">+127 majority</p>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Election Results - Final</CardTitle>
              <CardDescription>{mockResults.constituency}, {mockResults.region}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partyOrder.map(party => {
                  const result = mockResults.seats[party];
                  return (
                    <div key={party} className={`p-4 rounded-lg border ${getPartyBg(party)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold capitalize">{party} Party</p>
                            {result.winner && (
                              <Badge className="bg-green-600">
                                <Trophy className="w-3 h-3 mr-1" />
                                ELECTED
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.candidate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{result.votes.toLocaleString()}</p>
                          <p className={`text-sm font-bold ${getPartyColor(party)}`}>
                            {result.percentage}%
                          </p>
                        </div>
                      </div>

                      {/* Vote Bar */}
                      <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            party === 'green'
                              ? 'bg-green-600'
                              : party === 'labour'
                                ? 'bg-red-600'
                                : party === 'conservative'
                                  ? 'bg-blue-600'
                                  : party === 'libdem'
                                    ? 'bg-orange-600'
                                    : 'bg-gray-600'
                          }`}
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vote Breakdown */}
      {activeView === 'breakdown' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution by Ward</CardTitle>
              <CardDescription>Green Party performance across constituent areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { ward: 'Tyldesley North', greenVotes: 340, total: 650, percentage: 52 },
                { ward: 'Tyldesley South', greenVotes: 280, total: 580, percentage: 48 },
                { ward: 'Astley East', greenVotes: 215, total: 520, percentage: 41 },
                { ward: 'Mosley Common', greenVotes: 189, total: 497, percentage: 38 },
              ].map(ward => (
                <div key={ward.ward} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold">{ward.ward}</p>
                    <Badge className="bg-green-600">{ward.greenVotes} votes</Badge>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-green-600" style={{ width: `${ward.percentage}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ward.percentage}% of {ward.total} total votes
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Demographic Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Estimated Demographic Support</CardTitle>
              <CardDescription>Based on canvassing and polling data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { group: 'Age 18-34', support: 45, votes: 324 },
                { group: 'Age 35-54', support: 32, votes: 289 },
                { group: 'Age 55-74', support: 28, votes: 266 },
                { group: 'Age 75+', support: 22, votes: 145 },
              ].map(demo => (
                <div key={demo.group} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{demo.group}</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-green-600" style={{ width: `${demo.support}%` }} />
                    </div>
                  </div>
                  <p className="text-sm font-bold ml-4 w-16 text-right">{demo.votes}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis */}
      {activeView === 'analysis' && (
        <div className="space-y-6">
          {/* Swing Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Swing Analysis vs 2019</CardTitle>
              <CardDescription>Vote changes from previous election</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-bold text-green-700">Green Party</p>
                <p className="text-2xl font-bold text-green-600 mt-1">+177 votes</p>
                <p className="text-sm text-green-600 mt-1">
                  2019: 847 votes → 2026: 1,024 votes (+21%)
                </p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-bold text-red-700">Labour</p>
                <p className="text-2xl font-bold text-red-600 mt-1">-155 votes</p>
                <p className="text-sm text-red-600 mt-1">
                  2019: 1,052 votes → 2026: 897 votes (-15%)
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-bold text-blue-700">Conservative</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">-135 votes</p>
                <p className="text-sm text-blue-600 mt-1">
                  2019: 891 votes → 2026: 756 votes (-15%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  insight: 'Strong Growth',
                  description: '+21% Green vote increase driven by young voters (18-34) and climate policy focus',
                },
                {
                  insight: 'Labour Collapse',
                  description: '-155 votes suggests voters switching to Green for stronger environmental stance',
                },
                {
                  insight: 'Lib Dem Surge',
                  description: '+189 votes from 2019, now at 13%—indicates consolidated anti-Conservative vote',
                },
                {
                  insight: 'Winning Majority',
                  description: '+127 majority over Labour is narrow. Canvassing efficiency was critical.',
                },
                {
                  insight: 'Turnout Factor',
                  description: '52% turnout helped: higher engagement areas (Tyldesley North: 52% Green) performed best',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
                  <p className="font-bold">{item.insight}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Post-Election Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-bold text-blue-700 mb-1">For Emma Thompson (Incoming MP)</p>
                <ul className="text-blue-600 space-y-1">
                  <li>• Establish immediate office in Tyldesley (highest support: 52%)</li>
                  <li>• Launch monthly surgeries across 4 wards</li>
                  <li>• Deliver on climate commitments (main vote driver)</li>
                </ul>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="font-bold text-green-700 mb-1">For Party</p>
                <ul className="text-green-600 space-y-1">
                  <li>• Replicate Tyldesley North strategy in other marginal seats</li>
                  <li>• Target age 18-34 demographic nationally (45% support here)</li>
                  <li>• Protect seat with intensive local engagement</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Victory */}
      {activeView === 'share' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share the Victory
              </CardTitle>
              <CardDescription>Celebrate with supporters and media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  platform: 'Twitter/X',
                  icon: '𝕏',
                  text: '🟢 HISTORIC WIN! Emma Thompson elected as MP for Tyldesley & Mosley Common with 1,024 votes. A mandate for climate action and a sustainable future. Proud of our volunteers & supporters. #GreenWin #Election2026',
                },
                {
                  platform: 'Facebook',
                  icon: 'f',
                  text: 'WE WON! 🎉 Emma Thompson has been elected as your MP for Tyldesley & Mosley Common. 1,024 votes, 31.5% share, and a 127-vote majority. Together, we\'ve demonstrated that voters want real action on climate, cost of living, and our NHS. Thank you to every volunteer, donor, and supporter who made this possible. Now the real work begins!',
                },
                {
                  platform: 'Email Campaign',
                  icon: '✉',
                  text: 'Subject: We Did It! Emma Thompson Elected as MP\n\nDear Friends,\n\nIt\'s official: Emma Thompson has been elected as your MP! With 1,024 votes and a strong 31.5% share, we\'ve sent a clear message to Westminster that our community wants bold action on climate, housing, and the NHS.\n\n...',
                },
                {
                  platform: 'Press Release',
                  icon: '📰',
                  text: 'FOR IMMEDIATE RELEASE\n\nGreen Party Wins Tyldesley & Mosley Common\nEmma Thompson Elected with Strong Mandate for Climate Action\n\n7 May 2026 – Green Party candidate Emma Thompson has been elected as MP for Tyldesley & Mosley Common with 1,024 votes...',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold">{item.platform}</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                      <Share2 className="w-4 h-4" />
                      Copy & Share
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground font-mono">
                    {item.text.substring(0, 150)}...
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Victory Celebration Toolkit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Victory Celebration Toolkit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                📸 Download Social Media Graphics
              </Button>
              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                📹 Victory Statement Video (30s)
              </Button>
              <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                🎉 Event Planning Guide (Celebration Rally)
              </Button>
              <Button className="w-full gap-2" variant="outline">
                <Download className="w-4 h-4" />
                📊 Download Full Results PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}