import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Home, Target } from 'lucide-react';

const SUPPORT_ICONS = {
  strong_supporter: '✓',
  leaning: '~',
  undecided: '?',
  opposed: '✗',
  unknown: '○'
};

const SUPPORT_COLORS = {
  strong_supporter: 'bg-green-100 text-green-800',
  leaning: 'bg-blue-100 text-blue-800',
  undecided: 'bg-yellow-100 text-yellow-800',
  opposed: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-800'
};

export default function CanvassingStatsCards({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const supportLevels = [
    { key: 'strong_supporter', label: 'Strong' },
    { key: 'leaning', label: 'Leaning' },
    { key: 'undecided', label: 'Undecided' },
    { key: 'opposed', label: 'Opposed' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Doors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Doors Knocked</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDoors}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.sessionsCount} sessions · {stats.volunteersCount} volunteers
          </p>
        </CardContent>
      </Card>

      {/* Contacts Canvassed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contacts Canvassed</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.contactsCanvassed}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.contactsCanvassed > 0 ? Math.round((stats.contactsCanvassed / stats.totalContacts) * 100) : 0}% of database
          </p>
        </CardContent>
      </Card>

      {/* Daily Goal Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.dailyGoal > 0 ? Math.round((stats.totalDoors / stats.dailyGoal) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalDoors} / {stats.dailyGoal} doors
          </p>
        </CardContent>
      </Card>

      {/* Response Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalDoors > 0 ? Math.round(((stats.positiveResponses + stats.negativeResponses) / stats.totalDoors) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.positiveResponses + stats.negativeResponses} responses
          </p>
        </CardContent>
      </Card>

      {/* Support Levels Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Support Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {supportLevels.map(({ key, label }) => {
              const count = stats[key] || 0;
              const pct = stats.contactsCanvassed > 0 
                ? Math.round((count / stats.contactsCanvassed) * 100) 
                : 0;
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground min-w-6">
                      {SUPPORT_ICONS[key]}
                    </span>
                    <span className="text-sm">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={SUPPORT_COLORS[key]}>{count}</Badge>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Key Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.positiveResponses}</p>
              <p className="text-xs text-muted-foreground">Positive</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.negativeResponses}</p>
              <p className="text-xs text-muted-foreground">Negative</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.noAnswers}</p>
              <p className="text-xs text-muted-foreground">No Answer</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.undecidedCount}</p>
              <p className="text-xs text-muted-foreground">Undecided</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}