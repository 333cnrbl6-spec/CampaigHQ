import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star, Medal } from 'lucide-react';

const MEDAL_ICONS = {
  1: <Medal className="w-5 h-5 text-yellow-500" />,
  2: <Medal className="w-5 h-5 text-gray-400" />,
  3: <Medal className="w-5 h-5 text-orange-600" />,
};

const RANK_COLORS = {
  1: 'bg-yellow-50 border-yellow-200',
  2: 'bg-gray-50 border-gray-200',
  3: 'bg-orange-50 border-orange-200',
};

export default function GamifiedLeaderboard({ interactions, contacts }) {
  // Calculate leaderboard stats
  const leaderboard = useMemo(() => {
    if (!interactions?.length) return [];

    // Group by volunteer
    const volunteerStats = {};

    interactions.forEach(interaction => {
      const volunteer = interaction.logged_by;
      if (!volunteer) return;

      if (!volunteerStats[volunteer]) {
        volunteerStats[volunteer] = {
          volunteer: volunteer,
          doors_knocked: 0,
          positive_interactions: 0,
          neutral_interactions: 0,
          negative_interactions: 0,
          score: 0,
        };
      }

      volunteerStats[volunteer].doors_knocked += 1;

      if (interaction.outcome === 'positive') {
        volunteerStats[volunteer].positive_interactions += 1;
      } else if (interaction.outcome === 'neutral') {
        volunteerStats[volunteer].neutral_interactions += 1;
      } else if (interaction.outcome === 'negative') {
        volunteerStats[volunteer].negative_interactions += 1;
      }
    });

    // Calculate gamified score
    // Doors knocked (1 point each) + positive interactions (3 points each) + neutral (1 point each)
    Object.values(volunteerStats).forEach(stats => {
      stats.score = stats.doors_knocked + (stats.positive_interactions * 3) + stats.neutral_interactions;
    });

    return Object.values(volunteerStats)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [interactions]);

  const topCanvasser = leaderboard[0];
  const avgScore = leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, v) => sum + v.score, 0) / leaderboard.length) : 0;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Top Canvassers</CardTitle>
          </div>
          {topCanvasser && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Leading canvasser</p>
              <p className="text-sm font-bold text-primary">{topCanvasser.score} points</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No canvassing data yet. Start logging interactions!</p>
        ) : (
          <>
            {/* Top 3 podium */}
            {leaderboard.slice(0, 3).map((volunteer, idx) => {
              const rank = idx + 1;
              const isTopRank = rank <= 3;
              return (
                <div
                  key={volunteer.volunteer}
                  className={`rounded-lg border p-3 flex items-center justify-between transition-all ${
                    isTopRank ? RANK_COLORS[rank] : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      {MEDAL_ICONS[rank] || (
                        <span className="text-sm font-bold text-primary">{rank}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{volunteer.volunteer}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-muted-foreground">{volunteer.doors_knocked} doors</span>
                        {volunteer.positive_interactions > 0 && (
                          <span className="text-xs flex items-center gap-0.5">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {volunteer.positive_interactions}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-primary text-lg">{volunteer.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              );
            })}

            {/* Remaining ranks 4-10 */}
            {leaderboard.slice(3).length > 0 && (
              <div className="space-y-2 pt-2">
                {leaderboard.slice(3).map((volunteer, idx) => (
                  <div key={volunteer.volunteer} className="bg-muted/20 rounded p-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-6">#{idx + 4}</span>
                      <div>
                        <p className="font-medium text-xs">{volunteer.volunteer}</p>
                        <p className="text-xs text-muted-foreground">{volunteer.doors_knocked} doors</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">{volunteer.score}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Scoring info */}
            <div className="border-t border-border pt-3 mt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Scoring:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Each door knocked</span>
                  <Badge variant="outline" className="text-xs">+1 pt</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Positive interaction</span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">+3 pts</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Neutral interaction</span>
                  <Badge variant="outline" className="text-xs">+1 pt</Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}