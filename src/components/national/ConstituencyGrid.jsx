import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Target } from 'lucide-react';
import { useState } from 'react';

export default function ConstituencyGrid({ campaigns = [] }) {
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  // Organize by constituency
  const byConstituency = campaigns.reduce((acc, c) => {
    const key = c.constituency || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const constituencyData = Object.entries(byConstituency).map(([name, camps]) => {
    const totalContacts = camps.reduce((sum, c) => sum + (c.contactCount || 0), 0);
    const avgCanvass = camps.length > 0
      ? Math.round(camps.reduce((sum, c) => sum + (c.canvassingProgress || 0), 0) / camps.length)
      : 0;
    
    // Mock swing data (in real implementation, fetch from electoral database)
    const swingNeeded = Math.floor(Math.random() * 8) + 2; // 2-10%
    const isTargetSeat = swingNeeded <= 5;

    return {
      constituency: name,
      campaigns: camps,
      totalContacts,
      avgCanvass,
      swingNeeded,
      isTargetSeat,
      volunteerCount: camps.reduce((sum, c) => sum + Math.floor(totalContacts / 50), 0),
    };
  });

  const targetSeats = constituencyData.filter(c => c.isTargetSeat);
  const selectedData = selectedConstituency
    ? constituencyData.find(c => c.constituency === selectedConstituency)
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Constituencies</p>
              <p className="text-3xl font-bold">{constituencyData.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Target Seats (≤5% swing)</p>
              <p className="text-3xl font-bold text-primary">{targetSeats.length}</p>
              <p className="text-xs text-muted-foreground">Realistic winning opportunities</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Voters Contacted</p>
              <p className="text-3xl font-bold">
                {(constituencyData.reduce((sum, c) => sum + c.totalContacts, 0) / 1000).toFixed(1)}k
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Constituency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {constituencyData.map(const_data => (
          <Card
            key={const_data.constituency}
            className={`cursor-pointer transition-all ${
              selectedConstituency === const_data.constituency
                ? 'border-primary ring-2 ring-primary/50'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedConstituency(const_data.constituency)}
          >
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="text-lg">{const_data.constituency}</CardTitle>
                {const_data.isTargetSeat && (
                  <Badge className="w-fit bg-primary/20 text-primary">
                    <Target className="w-3 h-3 mr-1" /> Target Seat
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Swing needed */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Swing Needed</span>
                  <span className="text-sm font-bold">{const_data.swingNeeded}%</span>
                </div>
                <Progress value={Math.min(const_data.swingNeeded * 10, 100)} className="h-2" />
              </div>

              {/* Canvassing progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Canvassing Progress</span>
                  <span className="text-sm font-bold">{const_data.avgCanvass}%</span>
                </div>
                <Progress value={const_data.avgCanvass} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> Contacts
                  </p>
                  <p className="font-bold">{(const_data.totalContacts / 1000).toFixed(1)}k</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Campaigns
                  </p>
                  <p className="font-bold">{const_data.campaigns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected constituency detail */}
      {selectedData && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>{selectedData.constituency} — Detailed Breakdown</CardTitle>
            <CardDescription>Campaign details for this constituency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedData.campaigns.map(camp => (
                <div
                  key={camp.id}
                  className="p-4 bg-muted rounded-lg border flex items-start justify-between"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{camp.name}</h4>
                    <p className="text-sm text-muted-foreground">{camp.candidate_name}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span>{camp.contactCount?.toLocaleString() || 0} contacts</span>
                      <span>{camp.canvassingProgress || 0}% canvassed</span>
                      <Badge variant={camp.status === 'active' ? 'default' : 'secondary'}>
                        {camp.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}