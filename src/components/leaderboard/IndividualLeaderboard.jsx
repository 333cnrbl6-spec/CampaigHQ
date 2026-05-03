import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Zap, Target } from 'lucide-react';

export default function IndividualLeaderboard({ leaderboard = [], loading = false }) {
  const [sortBy, setSortBy] = useState('doors');

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No volunteer data available yet. Sessions will appear here as volunteers complete canvassing shifts.
        </CardContent>
      </Card>
    );
  }

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'doors') return b.doors_knocked - a.doors_knocked;
    if (sortBy === 'positive') return b.positive_responses - a.positive_responses;
    if (sortBy === 'efficiency') return b.efficiency_score - a.efficiency_score;
    return b.doors_knocked - a.doors_knocked;
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          {/* Sort Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('doors')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'doors' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Doors Knocked
            </button>
            <button
              onClick={() => setSortBy('positive')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'positive' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Positive Responses
            </button>
            <button
              onClick={() => setSortBy('efficiency')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'efficiency' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Efficiency
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="space-y-3">
            {sortedLeaderboard.map((volunteer, idx) => (
              <Card key={volunteer.email} className={idx < 3 ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank and Name */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg">
                        {idx === 0 && <span className="text-2xl">🥇</span>}
                        {idx === 1 && <span className="text-2xl">🥈</span>}
                        {idx === 2 && <span className="text-2xl">🥉</span>}
                        {idx >= 3 && <span className="text-muted-foreground">#{idx + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{volunteer.name}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-right">
                      <div>
                        <p className="text-2xl font-bold text-primary">{volunteer.doors_knocked}</p>
                        <p className="text-xs text-muted-foreground">Doors</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{volunteer.positive_responses}</p>
                        <p className="text-xs text-muted-foreground">Positive</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{volunteer.conversion_rate}%</p>
                        <p className="text-xs text-muted-foreground">Rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Achievement Badges */}
                  {volunteer.achievements && volunteer.achievements.length > 0 && (
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                      {volunteer.achievements.slice(0, 3).map((badge) => (
                        <Badge key={badge.name} variant="secondary" className="text-xs">
                          {badge.icon} {badge.name}
                        </Badge>
                      ))}
                      {volunteer.achievements.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{volunteer.achievements.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4">
            {sortedLeaderboard
              .filter(v => v.achievements && v.achievements.length > 0)
              .sort((a, b) => (b.achievements?.length || 0) - (a.achievements?.length || 0))
              .slice(0, 10)
              .map((volunteer) => (
                <Card key={volunteer.email}>
                  <CardContent className="pt-4">
                    <p className="font-semibold mb-3">{volunteer.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteer.achievements.map((badge) => (
                        <div key={badge.name} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                          <span className="text-xl">{badge.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}