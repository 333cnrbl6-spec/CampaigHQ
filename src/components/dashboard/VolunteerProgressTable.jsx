import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Zap } from 'lucide-react';

export default function VolunteerProgressTable({ volunteers = [] }) {
  if (volunteers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Volunteer Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No volunteer data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by doors knocked descending
  const sorted = [...volunteers].sort((a, b) => (b.doorsKnocked || 0) - (a.doorsKnocked || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Award className="w-4 h-4" />
          Volunteer Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sorted.map((volunteer, idx) => {
            const goalProgress = volunteer.dailyGoal > 0 
              ? Math.round((volunteer.doorsKnocked / volunteer.dailyGoal) * 100)
              : 0;
            const isLeader = idx === 0;

            return (
              <div
                key={volunteer.email}
                className={`p-3 rounded-lg border transition-colors ${
                  isLeader ? 'bg-amber-50 border-amber-200' : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isLeader && <Zap className="w-4 h-4 text-amber-600" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{volunteer.name}</p>
                      <p className="text-xs text-muted-foreground">{volunteer.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-lg">{volunteer.doorsKnocked}</p>
                    <p className="text-xs text-muted-foreground">doors</p>
                  </div>
                </div>

                {/* Progress bar */}
                {volunteer.dailyGoal > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Daily Goal</span>
                      <span className="font-medium">
                        {volunteer.doorsKnocked} / {volunteer.dailyGoal}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(goalProgress, 100)} 
                      className="h-2"
                    />
                    {goalProgress >= 100 && (
                      <p className="text-xs text-green-600 font-medium">✓ Goal reached!</p>
                    )}
                  </div>
                )}

                {/* Support breakdown */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {volunteer.strong_supporter > 0 && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      ✓ {volunteer.strong_supporter}
                    </Badge>
                  )}
                  {volunteer.leaning > 0 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      ~ {volunteer.leaning}
                    </Badge>
                  )}
                  {volunteer.undecided > 0 && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      ? {volunteer.undecided}
                    </Badge>
                  )}
                  {volunteer.opposed > 0 && (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                      ✗ {volunteer.opposed}
                    </Badge>
                  )}
                </div>

                {/* Sessions info */}
                <p className="text-xs text-muted-foreground mt-2">
                  {volunteer.sessionsCount} session{volunteer.sessionsCount !== 1 ? 's' : ''} · Last: {volunteer.lastSession || 'N/A'}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}