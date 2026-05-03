import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Zap, Target, TrendingUp } from 'lucide-react';
import IndividualLeaderboard from '@/components/leaderboard/IndividualLeaderboard';
import TeamLeaderboard from '@/components/leaderboard/TeamLeaderboard';

export default function EngagementLeaderboard() {
  const { campaign } = useCampaign();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('getVolunteerAchievements', {
          campaign_id: campaign?.id,
        });
        setData(response.data);
      } catch (err) {
        console.error('Failed to load achievements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (campaign?.id) {
      loadAchievements();
    }
  }, [campaign?.id]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading leaderboard: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          Engagement Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Celebrate volunteer achievements and drive friendly competition across the campaign.
        </p>
      </div>

      {/* Key Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Volunteers</p>
              <p className="text-3xl font-bold mt-1">{data.total_volunteers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Doors Knocked</p>
              <p className="text-3xl font-bold mt-1 text-primary">{data.total_doors_knocked.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Positive Responses</p>
              <p className="text-3xl font-bold mt-1 text-green-600">{data.total_positive_responses.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-3xl font-bold mt-1 text-blue-600">
                {data.total_doors_knocked > 0
                  ? Math.round((data.total_positive_responses / data.total_doors_knocked) * 100)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboards */}
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Individual Rankings
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Team Competition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>How it works:</strong> Volunteers earn achievements through doors knocked, positive responses, and consistent effort. Rankings update as canvassing sessions are logged.
            </p>
          </div>
          <IndividualLeaderboard
            leaderboard={data?.individual_leaderboard}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-900">
              <strong>Team Leaderboard:</strong> Combined performance metrics for each team lead. Encourages collaboration and friendly competition.
            </p>
          </div>
          <TeamLeaderboard
            teams={data?.team_leaderboard}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Achievement Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Earn Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '💯', name: 'Century', desc: '100+ doors knocked' },
              { icon: '🏆', name: 'Hall of Fame', desc: '500+ doors knocked' },
              { icon: '🎯', name: 'Persuader', desc: '50+ positive responses' },
              { icon: '🌉', name: 'Bridge Builder', desc: '30+ undecided conversations' },
              { icon: '⭐', name: 'Dedicated', desc: '10+ canvassing sessions' },
              { icon: '✨', name: 'Effective', desc: '40%+ conversion rate' },
              { icon: '📋', name: 'Leaflet Champion', desc: '500+ leaflets delivered' },
            ].map((achievement) => (
              <div key={achievement.name} className="flex gap-3 p-3 bg-muted/40 rounded-lg">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <p className="font-medium text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}