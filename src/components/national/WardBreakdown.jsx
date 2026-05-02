import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function WardBreakdown({ campaigns = [], selectedConstituency = null }) {
  const [expandedCampaign, setExpandedCampaign] = useState(null);

  // Mock ward data (in production, import from electoral commission data)
  const generateMockWards = (campaign) => {
    const wardCount = Math.floor(Math.random() * 5) + 3; // 3-7 wards
    const wardsPerCampaign = [];
    const contactsPerWard = Math.floor((campaign.contactCount || 0) / wardCount);

    for (let i = 0; i < wardCount; i++) {
      wardsPerCampaign.push({
        id: `${campaign.id}-ward-${i}`,
        name: `Ward ${String.fromCharCode(65 + i)}`,
        contacts: Math.floor(contactsPerWard + (Math.random() * contactsPerWard * 0.2)),
        canvassed: Math.floor(Math.random() * 100),
        supportLevel: {
          strong: Math.floor(Math.random() * 30),
          lean: Math.floor(Math.random() * 40),
          undecided: Math.floor(Math.random() * 20),
          opposed: Math.floor(Math.random() * 10),
        },
      });
    }
    return wardsPerCampaign;
  };

  const campaignWards = selectedConstituency
    ? campaigns
        .filter(c => c.constituency === selectedConstituency)
        .flatMap(c => ({
          campaignName: c.name,
          campaignId: c.id,
          wards: generateMockWards(c),
        }))
    : campaigns.slice(0, 3).flatMap(c => ({
        campaignName: c.name,
        campaignId: c.id,
        wards: generateMockWards(c),
      }));

  const allWards = campaignWards.flatMap(cw => cw.wards);
  const totalWards = allWards.length;
  const avgCanvassProgress = allWards.length > 0
    ? Math.round(allWards.reduce((sum, w) => sum + w.canvassed, 0) / allWards.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Ward Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Wards</p>
              <p className="text-3xl font-bold">{totalWards}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Ward Canvassing</p>
              <p className="text-3xl font-bold">{avgCanvassProgress}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Contacts (Wards)</p>
              <p className="text-3xl font-bold">
                {(allWards.reduce((sum, w) => sum + w.contacts, 0) / 1000).toFixed(1)}k
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign wards breakdown */}
      <div className="space-y-4">
        {campaignWards.map(cw => (
          <Card key={cw.campaignId}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {cw.campaignName}
              </CardTitle>
              <CardDescription>{cw.wards.length} wards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cw.wards.map(ward => {
                const supportTotal = Object.values(ward.supportLevel).reduce((a, b) => a + b, 0) || 1;
                const strongPct = Math.round((ward.supportLevel.strong / supportTotal) * 100) || 0;

                return (
                  <div
                    key={ward.id}
                    className="p-3 bg-muted rounded-lg border space-y-2 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{ward.name}</h4>
                      <Badge variant="outline">{ward.contacts} contacts</Badge>
                    </div>

                    {/* Canvassing progress */}
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span className="text-muted-foreground">Canvassing</span>
                        <span className="font-medium">{ward.canvassed}%</span>
                      </div>
                      <Progress value={ward.canvassed} className="h-2" />
                    </div>

                    {/* Support breakdown */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-green-700 font-bold">{strongPct}%</p>
                        <p className="text-muted-foreground text-xs">Strong</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-blue-700 font-bold">
                          {Math.round((ward.supportLevel.lean / supportTotal) * 100) || 0}%
                        </p>
                        <p className="text-muted-foreground text-xs">Lean</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <p className="text-slate-700 font-bold">
                          {Math.round((ward.supportLevel.undecided / supportTotal) * 100) || 0}%
                        </p>
                        <p className="text-muted-foreground text-xs">Undecided</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-red-700 font-bold">
                          {Math.round((ward.supportLevel.opposed / supportTotal) * 100) || 0}%
                        </p>
                        <p className="text-muted-foreground text-xs">Opposed</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}