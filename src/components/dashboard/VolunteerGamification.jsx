import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Star, Medal } from 'lucide-react';
import { useCampaign } from '@/lib/CampaignContext';

export default function VolunteerGamification() {
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;

  // Fetch canvassing logs to calculate achievements
  const { data: volunteers = [], isLoading } = useQuery({
    queryKey: ['volunteerAchievements', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.CanvassingLog.list('-created_date', 10000);
        const logs = Array.isArray(all) ? all.filter(l => l.campaign_id === campaignId) : [];
        
        // Group by volunteer and calculate achievements
        const byVolunteer = {};
        logs.forEach(log => {
          const email = log.volunteer_email || log.volunteer_name || 'Unknown';
          if (!byVolunteer[email]) {
            byVolunteer[email] = {
              name: log.volunteer_name || email,
              email: email,
              total_doors: 0,
              sessions_count: 0,
              positive_responses: 0,
              negative_responses: 0,
              current_streak: 0,
              days_since_last_session: 0,
              response_rate: 0,
              momentum_score: 0,
              badges: [],
            };
          }
          byVolunteer[email].total_doors += log.doors_knocked || 0;
          byVolunteer[email].sessions_count += 1;
          byVolunteer[email].positive_responses += log.positive_responses || 0;
          byVolunteer[email].negative_responses += log.negative_responses || 0;
        });

        // Calculate metrics
        Object.values(byVolunteer).forEach(vol => {
          vol.response_rate = vol.total_doors > 0 
            ? Math.round((vol.positive_responses / vol.total_doors) * 100)
            : 0;
          vol.momentum_score = vol.total_doors + (vol.positive_responses * 2);
          
          // Assign basic badges
          if (vol.sessions_count >= 10) vol.badges.push({ id: 1, label: 'Active', description: '10+ sessions' });
          if (vol.response_rate >= 50) vol.badges.push({ id: 2, label: 'Persuader', description: '50%+ positive' });
          if (vol.total_doors >= 100) vol.badges.push({ id: 3, label: 'Canvasser', description: '100+ doors' });
        });

        return Object.values(byVolunteer).sort((a, b) => b.momentum_score - a.momentum_score);
      } catch (err) {
        console.error('Failed to fetch achievements:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const summary = {
    total_volunteers: volunteers.length,
    top_streak: Math.max(...volunteers.map(v => v.current_streak || 0), 0),
    average_response_rate: volunteers.length > 0 
      ? Math.round(volunteers.reduce((sum, v) => sum + v.response_rate, 0) / volunteers.length)
      : 0,
    most_active: volunteers[0]?.name || 'None yet',
  };
  const topVolunteers = volunteers.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading leaderboard...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total_volunteers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Top Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.top_streak}</p>
            <p className="text-xs text-muted-foreground">consecutive days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.average_response_rate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500" /> Most Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">{summary.most_active}</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Volunteer Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topVolunteers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No volunteers yet</p>
            ) : (
              topVolunteers.map((vol, idx) => (
                <div
                  key={vol.email}
                  className={`p-3 rounded-lg border ${
                    idx === 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-200'
                      : idx === 2
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      {idx === 0 && (
                        <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-sm">
                          🥇
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-sm">
                          🥈
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                          🥉
                        </div>
                      )}
                      {idx >= 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    {/* Volunteer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{vol.name}</p>
                        {vol.days_since_last_session === 0 && (
                          <Badge className="text-xs bg-green-500">Active Today</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {vol.current_streak > 0 && (
                          <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3" />
                            {vol.current_streak}-day streak
                          </div>
                        )}
                        {vol.badges.slice(0, 2).map(badge => (
                          <Badge key={badge.id} variant="secondary" className="text-xs">
                            {badge.label}
                          </Badge>
                        ))}
                        {vol.badges.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{vol.badges.length - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>🚪 {vol.total_doors} doors</span>
                        <span>✅ {vol.response_rate}% response</span>
                        <span>📊 {vol.sessions_count} sessions</span>
                      </div>
                    </div>

                    {/* Momentum Score */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-primary">{Math.round(vol.momentum_score)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Showcase */}
      {volunteers.filter(v => v.badges.length > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="w-4 h-4 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {volunteers
                .flatMap(vol =>
                  vol.badges.map(badge => ({
                    ...badge,
                    volunteer: vol.name,
                  }))
                )
                .slice(0, 6)
                .map((achievement, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                    <p className="text-lg mb-1">{achievement.label.split(' ')[0]}</p>
                    <p className="text-xs font-medium text-purple-900">{achievement.volunteer}</p>
                    <p className="text-[10px] text-purple-700 mt-1">{achievement.description}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}