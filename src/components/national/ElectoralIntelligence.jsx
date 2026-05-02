import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, MapPin, BarChart3, ArrowUpRight, Filter } from 'lucide-react';
import { useState } from 'react';

export default function ElectoralIntelligence({ campaigns = [] }) {
  const [selectedTier, setSelectedTier] = useState('tier1');
  const [sortBy, setSortBy] = useState('gap_to_winner');

  // Mock 2024 election data for demo
  const targetSeats = [
    {
      id: 'seat-1',
      constituency: 'Bristol West',
      region: 'South West',
      winner: 'Labour (Thangam Debbonaire)',
      winningParty: 'Labour',
      votes2024: { green: 12400, labour: 18900, conservative: 8200, libdem: 5300 },
      votesNeeded: 6600,
      gapToWinner: 6500,
      swing2024: 4.2,
      priority: 'tier1',
      notes: 'Strong Green second place, growth trajectory excellent',
    },
    {
      id: 'seat-2',
      constituency: 'Cambridge',
      region: 'East Anglia',
      winner: 'Labour (Daniel Zeichner)',
      winningParty: 'Labour',
      votes2024: { green: 11200, labour: 17800, conservative: 6100, libdem: 4200 },
      votesNeeded: 6700,
      gapToWinner: 6600,
      swing2024: 3.8,
      priority: 'tier1',
      notes: 'University seat, young demographic favours Greens',
    },
    {
      id: 'seat-3',
      constituency: 'Edinburgh North and Leith',
      region: 'Scotland',
      winner: 'SNP (Deidre Brock)',
      winningParty: 'SNP',
      votes2024: { green: 9800, labour: 12100, conservative: 4200, libdem: 3100 },
      votesNeeded: 2400,
      gapToWinner: 2300,
      swing2024: 2.1,
      priority: 'tier1',
      notes: 'SNP vulnerability opening, strong environmental focus',
    },
    {
      id: 'seat-4',
      constituency: 'Hove',
      region: 'South East',
      winner: 'Labour (Peter Kyle)',
      winningParty: 'Labour',
      votes2024: { green: 13900, labour: 19100, conservative: 5800, libdem: 4200 },
      votesNeeded: 5300,
      gapToWinner: 5200,
      swing2024: 4.5,
      priority: 'tier1',
      notes: 'Coastal seat, environmental activism strong',
    },
    {
      id: 'seat-5',
      constituency: 'Oxford East',
      region: 'South East',
      winner: 'Labour (Anneliese Dodds)',
      winningParty: 'Labour',
      votes2024: { green: 10100, labour: 16200, conservative: 5100, libdem: 3800 },
      votesNeeded: 6200,
      gapToWinner: 6100,
      swing2024: 3.2,
      priority: 'tier2',
      notes: 'University seat, climate activism hub',
    },
    {
      id: 'seat-6',
      constituency: 'Brighton Pavilion',
      region: 'South East',
      winner: 'Green (Siân Berry)',
      winningParty: 'Green',
      votes2024: { green: 24300, labour: 12800, conservative: 3200, libdem: 2100 },
      votesNeeded: 0,
      gapToWinner: 0,
      swing2024: 1.2,
      priority: 'held',
      notes: 'Green held seat, defending in 2029',
    },
  ];

  const tierTargets = {
    tier1: 'Tier 1: Highly Winnable (1-3% swing needed)',
    tier2: 'Tier 2: Potentially Winnable (3-6% swing needed)',
    tier3: 'Tier 3: Long-term Targets (6%+ swing needed)',
  };

  const filteredSeats = targetSeats
    .filter(seat => selectedTier === 'all' || seat.priority === selectedTier)
    .sort((a, b) => {
      if (sortBy === 'gap_to_winner') return a.gapToWinner - b.gapToWinner;
      if (sortBy === 'swing') return a.swing2024 - b.swing2024;
      return a.constituency.localeCompare(b.constituency);
    });

  const tier1Count = targetSeats.filter(s => s.priority === 'tier1').length;
  const tier2Count = targetSeats.filter(s => s.priority === 'tier2').length;
  const greenHeld = targetSeats.filter(s => s.priority === 'held').length;

  const getBackgroundColor = (priority) => {
    switch (priority) {
      case 'tier1': return 'bg-green-50 border-green-200';
      case 'tier2': return 'bg-amber-50 border-amber-200';
      case 'tier3': return 'bg-orange-50 border-orange-200';
      case 'held': return 'bg-primary/10 border-primary/20';
      default: return 'bg-muted border-border';
    }
  };

  const getBadgeColor = (priority) => {
    switch (priority) {
      case 'tier1': return 'bg-green-600 text-white';
      case 'tier2': return 'bg-amber-600 text-white';
      case 'tier3': return 'bg-orange-600 text-white';
      case 'held': return 'bg-primary text-primary-foreground';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tier 1 Targets</p>
              <p className="text-3xl font-bold text-green-600">{tier1Count}</p>
              <p className="text-xs text-muted-foreground">Highly winnable</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tier 2 Targets</p>
              <p className="text-3xl font-bold text-amber-600">{tier2Count}</p>
              <p className="text-xs text-muted-foreground">Potentially winnable</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Green Held</p>
              <p className="text-3xl font-bold text-primary">{greenHeld}</p>
              <p className="text-xs text-muted-foreground">Brighton Pavilion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Targets</p>
              <p className="text-3xl font-bold">{targetSeats.length}</p>
              <p className="text-xs text-muted-foreground">2029 Strategic Focus</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Sort */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          {['tier1', 'tier2', 'tier3', 'all'].map(tier => (
            <Button
              key={tier}
              size="sm"
              variant={selectedTier === tier ? 'default' : 'outline'}
              onClick={() => setSelectedTier(tier)}
              className={
                selectedTier === tier && tier !== 'all'
                  ? tier === 'tier1'
                    ? 'bg-green-600 hover:bg-green-700'
                    : tier === 'tier2'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  : ''
              }
            >
              {tier === 'all' ? 'All Targets' : `Tier ${tier.slice(-1)}`}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-input bg-background"
          >
            <option value="gap_to_winner">Sort by Gap to Winner</option>
            <option value="swing">Sort by Swing Needed</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Target Seats Grid */}
      <div className="space-y-3">
        {filteredSeats.map(seat => {
          const votePct = seat.votes2024.green / seat.votes2024.green + seat.votes2024.labour;
          return (
            <Card
              key={seat.id}
              className={`border transition-all hover:shadow-md ${getBackgroundColor(seat.priority)}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{seat.constituency}</h3>
                      <Badge className={getBadgeColor(seat.priority)}>
                        {seat.priority === 'tier1'
                          ? '🎯 TIER 1'
                          : seat.priority === 'tier2'
                            ? 'TIER 2'
                            : seat.priority === 'held'
                              ? '✓ HELD'
                              : 'TIER 3'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {seat.region} • {seat.notes}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    {seat.priority !== 'held' && (
                      <>
                        <p className="text-sm font-bold text-primary">
                          <ArrowUpRight className="w-3 h-3 inline mr-1" />
                          {seat.swing2024}% swing
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {seat.votesNeeded.toLocaleString()} votes needed
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Vote Share Visualization */}
                <div className="space-y-2 mb-4">
                  <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                    {[
                      { party: 'Lab', votes: seat.votes2024.labour, color: 'bg-red-500' },
                      { party: 'Green', votes: seat.votes2024.green, color: 'bg-green-500' },
                      { party: 'Con', votes: seat.votes2024.conservative, color: 'bg-blue-500' },
                      { party: 'LD', votes: seat.votes2024.libdem, color: 'bg-orange-500' },
                    ].map(({ party, votes, color }) => {
                      const pct =
                        ((votes / Object.values(seat.votes2024).reduce((a, b) => a + b, 0)) * 100)
                          .toFixed(0);
                      return (
                        <div
                          key={party}
                          className={`${color}`}
                          style={{ width: `${pct}%` }}
                          title={`${party}: ${pct}%`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Green: {((seat.votes2024.green / Object.values(seat.votes2024).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                    </span>
                    <span>
                      Winner ({seat.winningParty}):
                      {((seat.votes2024[seat.winningParty.toLowerCase()] / Object.values(seat.votes2024).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-white/50 rounded border">
                    <p className="text-muted-foreground">Gap to Winner</p>
                    <p className="font-bold">
                      {seat.gapToWinner.toLocaleString()} votes
                    </p>
                  </div>
                  <div className="p-2 bg-white/50 rounded border">
                    <p className="text-muted-foreground">2024 Green Vote</p>
                    <p className="font-bold">{seat.votes2024.green.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded border">
                    <p className="text-muted-foreground">Last Election Swing</p>
                    <p className="font-bold text-green-600">+{seat.swing2024}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strategy Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            2029 Target Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-semibold text-green-700">Tier 1: Win-Ready (Next Election)</p>
              <p className="text-green-600 text-xs mt-1">
                Seats where Greens are close to winning. Focused resources, national support,
                intensive campaigning.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-700">Tier 2: Build Towards (Medium-term)</p>
              <p className="text-amber-600 text-xs mt-1">
                Seats with strong growth trajectory. Build volunteer capacity, test messaging,
                establish networks.
              </p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-700">Tier 3: Invest (Long-term)</p>
              <p className="text-orange-600 text-xs mt-1">
                Seats to develop for future elections. Local party support, policy development,
                gradual profile raising.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Import Your Election Data
          </CardTitle>
          <CardDescription>Upload 2024 results or real electoral data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This data is based on 2024 general election results. Import your actual campaign data
            to see real swing analysis:
          </p>
          <div className="p-4 bg-muted rounded-lg border-2 border-dashed text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload CSV with: Constituency, 2024 Greens, 2024 Winner, Winner Party
            </p>
            <Button variant="outline">Upload Electoral Data CSV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}