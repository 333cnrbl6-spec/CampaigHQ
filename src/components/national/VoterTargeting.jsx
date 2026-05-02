import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Filter, BarChart3, Zap, Plus } from 'lucide-react';
import { useState } from 'react';

export default function VoterTargeting() {
  const [selectedSegment, setSelectedSegment] = useState(null);

  const voterSegments = [
    {
      id: 'seg-1',
      name: '18-24 Environmental Activists',
      size: 12400,
      conviction: 92,
      area: 'Urban areas',
      description: 'Highest environmental concern, digital-native',
      campaigns: 8,
      contactMethod: ['Email', 'Text', 'Social'],
      messagingPillar: 'Climate & Environment',
    },
    {
      id: 'seg-2',
      name: 'Renters (Cost of Living Crisis)',
      size: 8700,
      conviction: 78,
      area: 'All regions',
      description: 'Struggling with rent, healthcare access',
      campaigns: 12,
      contactMethod: ['Email', 'Door knock', 'Phone'],
      messagingPillar: 'Housing & Affordability',
    },
    {
      id: 'seg-3',
      name: 'NHS Workers & Supporters',
      size: 5200,
      conviction: 85,
      area: 'Urban centers',
      description: 'Healthcare professionals, carers, patient advocates',
      campaigns: 6,
      contactMethod: ['Email', 'Phone'],
      messagingPillar: 'NHS & Healthcare',
    },
    {
      id: 'seg-4',
      name: 'Low-Income Families',
      size: 6100,
      conviction: 68,
      area: 'All regions',
      description: 'Affected by cost-of-living, struggling with basics',
      campaigns: 10,
      contactMethod: ['Door knock', 'Text'],
      messagingPillar: 'Cost of Living',
    },
    {
      id: 'seg-5',
      name: 'Workers (Fair Pay Advocates)',
      size: 9300,
      conviction: 74,
      area: 'Industrial areas',
      description: 'Union members, low-wage workers, gig economy workers',
      campaigns: 7,
      contactMethod: ['Email', 'Phone', 'Door knock'],
      messagingPillar: 'Workers & Fair Pay',
    },
  ];

  const selectedData = selectedSegment
    ? voterSegments.find(s => s.id === selectedSegment)
    : null;

  const totalVoters = voterSegments.reduce((sum, s) => sum + s.size, 0);
  const avgConviction = Math.round(
    voterSegments.reduce((sum, s) => sum + s.conviction, 0) / voterSegments.length
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Voter Segments</p>
              <p className="text-3xl font-bold">{voterSegments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Segmented Voters</p>
              <p className="text-3xl font-bold">{(totalVoters / 1000).toFixed(1)}k</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Conviction Rate</p>
              <p className="text-3xl font-bold">{avgConviction}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Create Segment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {voterSegments.map(segment => (
          <Card
            key={segment.id}
            className={`cursor-pointer transition-all ${
              selectedSegment === segment.id
                ? 'border-primary ring-2 ring-primary/50'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedSegment(segment.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  <CardDescription>{segment.description}</CardDescription>
                </div>
                <Badge className="bg-primary/20 text-primary">
                  {segment.conviction}% conviction
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Voters in Segment</p>
                  <p className="font-bold">{segment.size.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Campaigns Using</p>
                  <p className="font-bold">{segment.campaigns}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Contact Methods</p>
                <div className="flex gap-1 flex-wrap">
                  {segment.contactMethod.map(method => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Segment Detail */}
      {selectedData && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {selectedData.name} — Campaign Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Geographic Focus</p>
                <p className="font-bold">{selectedData.area}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Primary Messaging</p>
                <p className="font-bold">{selectedData.messagingPillar}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Conviction Rate</p>
                <p className="font-bold text-primary">{selectedData.conviction}%</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold">Recommended Contact Strategy</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Initial Contact:</strong> {selectedData.contactMethod.join(', ')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Message Focus:</strong> {selectedData.messagingPillar}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Follow-up Sequence:</strong> Automated email/SMS sequence over 4 weeks
                  </span>
                </li>
              </ul>
              <Button className="w-full gap-2">
                <Filter className="w-4 h-4" />
                Create Outreach Campaign for This Segment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Import Voter Data
          </CardTitle>
          <CardDescription>
            Upload voter lists, postcodes, or demographic files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-muted rounded-lg border-2 border-dashed text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Drag CSV, Excel, or JSON files here
            </p>
            <Button variant="outline">Choose Files</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports: Postcode lists, electoral roll data, demographic segmentation files
          </p>
        </CardContent>
      </Card>
    </div>
  );
}