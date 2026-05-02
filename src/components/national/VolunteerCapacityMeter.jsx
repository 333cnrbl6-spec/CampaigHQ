import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Users, Zap } from 'lucide-react';

export default function VolunteerCapacityMeter({ campaigns = [] }) {
  // Calculate volunteer metrics
  const totalVolunteers = campaigns.reduce((sum, c) => {
    // Estimate: ~1 volunteer per 50 contacts (industry standard)
    return sum + Math.max(Math.floor((c.contactCount || 0) / 50), 1);
  }, 0);

  const requiredVolunteers = campaigns.reduce((sum, c) => {
    // Target: 100% canvassing coverage = need more volunteers for uncompleted work
    const uncovered = (c.contactCount || 0) * (1 - (c.canvassingProgress || 0) / 100);
    return sum + Math.max(Math.floor(uncovered / 50), 1);
  }, 0);

  const capacityRatio = totalVolunteers > 0 ? Math.round((totalVolunteers / requiredVolunteers) * 100) : 0;
  const isUnderstaffed = capacityRatio < 80;

  // Group by capacity status
  const byCapacity = campaigns.reduce((acc, c) => {
    const est_vol = Math.max(Math.floor((c.contactCount || 0) / 50), 1);
    const status = est_vol > 30 ? 'well-staffed' : est_vol > 15 ? 'adequate' : 'understaffed';
    if (!acc[status]) acc[status] = [];
    acc[status].push(c);
    return acc;
  }, {});

  const wellStaffed = byCapacity['well-staffed'] || [];
  const adequate = byCapacity['adequate'] || [];
  const understaffed = byCapacity['understaffed'] || [];

  return (
    <div className="space-y-6">
      {/* Overall Capacity Card */}
      <Card className={isUnderstaffed ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Volunteer Capacity Analysis
          </CardTitle>
          <CardDescription>
            Estimated volunteer needs vs. available capacity across all campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Estimated Active Volunteers</p>
              <p className="text-3xl font-bold">{totalVolunteers}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Volunteers Needed (Full Coverage)</p>
              <p className="text-3xl font-bold">{requiredVolunteers}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Capacity Status</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{capacityRatio}%</p>
                <Badge variant={isUnderstaffed ? 'destructive' : 'default'}>
                  {isUnderstaffed ? 'Understaffed' : 'Healthy'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Capacity progress bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span>Overall Capacity Ratio</span>
              <span>{capacityRatio}% of needed</span>
            </div>
            <Progress value={Math.min(capacityRatio, 100)} className="h-3" />
          </div>

          {isUnderstaffed && (
            <div className="flex gap-2 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Action needed:</p>
                <p>You need {requiredVolunteers - totalVolunteers} more volunteers to reach full coverage.</p>
                <p className="text-xs mt-1 opacity-75">Consider cross-campaign volunteer surge or recruitment drive.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign-by-campaign breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Well-staffed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              Well-Staffed
            </CardTitle>
            <CardDescription>{wellStaffed.length} campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {wellStaffed.map(c => (
              <div
                key={c.id}
                className="p-2 rounded bg-green-50 border border-green-200 text-sm"
              >
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  ~{Math.floor((c.contactCount || 0) / 50)} volunteers
                </p>
              </div>
            ))}
            {wellStaffed.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">None yet</p>
            )}
          </CardContent>
        </Card>

        {/* Adequate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Adequate
            </CardTitle>
            <CardDescription>{adequate.length} campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {adequate.map(c => (
              <div
                key={c.id}
                className="p-2 rounded bg-blue-50 border border-blue-200 text-sm"
              >
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  ~{Math.floor((c.contactCount || 0) / 50)} volunteers
                </p>
              </div>
            ))}
            {adequate.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">None yet</p>
            )}
          </CardContent>
        </Card>

        {/* Understaffed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Understaffed
            </CardTitle>
            <CardDescription>{understaffed.length} campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {understaffed.map(c => (
              <div
                key={c.id}
                className="p-2 rounded bg-amber-50 border border-amber-200 text-sm"
              >
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  ~{Math.floor((c.contactCount || 0) / 50)} volunteers
                </p>
              </div>
            ))}
            {understaffed.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">None yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}