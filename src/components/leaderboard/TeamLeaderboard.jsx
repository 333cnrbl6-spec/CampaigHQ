import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Zap, Target } from 'lucide-react';

export default function TeamLeaderboard({ teams = [], loading = false }) {
  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No team data available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team, idx) => {
        const avgDoorsPerVolunteer = Math.round(team.total_doors / Math.max(1, team.volunteer_count));
        const avgPositivePerVolunteer = Math.round(team.total_positive / Math.max(1, team.volunteer_count));

        return (
          <Card key={team.team_lead} className={idx < 3 ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Rank and Team */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">
                    {idx === 0 && '🥇'}
                    {idx === 1 && '🥈'}
                    {idx === 2 && '🥉'}
                    {idx >= 3 && <span className="text-muted-foreground font-bold">#{idx + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{team.team_lead || 'Unassigned Team'}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="w-4 h-4" />
                      {team.volunteer_count} volunteer{team.volunteer_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-2xl font-bold text-primary">{team.total_doors}</p>
                    <p className="text-xs text-muted-foreground">Total Doors</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{team.total_positive}</p>
                    <p className="text-xs text-muted-foreground">Positive</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{avgDoorsPerVolunteer}</p>
                    <p className="text-xs text-muted-foreground">Avg/Volunteer</p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Top Contributors</p>
                <div className="flex flex-wrap gap-2">
                  {team.members
                    .sort((a, b) => b.doors - a.doors)
                    .slice(0, 3)
                    .map((member) => (
                      <Badge key={member.name} variant="secondary" className="text-xs">
                        {member.name} ({member.doors})
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (team.total_doors / 1000) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Campaign Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}