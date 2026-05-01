import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, Target, AlertCircle } from 'lucide-react';

export default function CanvassingOptimization() {
  const [selectedStreet, setSelectedStreet] = useState(null);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['canvassingPatterns'],
    queryFn: () => base44.functions.invoke('analyzeCanvassingPatterns', {}),
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('name', 1000),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">⏳</div> Analyzing patterns...
      </div>
    );
  }

  const patterns = analysis?.data?.patterns || [];
  const summary = analysis?.data?.summary || {};
  const unassignedTurfs = turfs.filter(t => !t.assigned_to && (!t.assigned_team || t.assigned_team.length === 0));

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 40) return 'text-yellow-600';
    return 'text-amber-600';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Canvassing Optimization</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Historical analysis to predict optimal visit times and response rates
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
        </div>

        {patterns.length === 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Insufficient data</p>
                <p className="mt-1">Need at least some canvassing logs to analyze patterns. Import data or conduct some canvassing sessions first.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {patterns.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Streets Analyzed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.total_streets}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.total_sessions}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.average_response_rate}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Best Street</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold truncate">{summary.best_performing_street}</p>
                  <p className="text-xs text-muted-foreground">{summary.best_response_rate}% response</p>
                </CardContent>
              </Card>
            </div>

            {/* Streets & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Street List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Street Performance & Optimal Windows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {patterns.map((street) => (
                        <button
                          key={street.street_name}
                          onClick={() => setSelectedStreet(street)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedStreet?.street_name === street.street_name
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-muted/30 border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{street.street_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {street.total_sessions} sessions · {street.total_doors} doors knocked
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-green-600">{street.overall_response_rate}%</p>
                              <p className="text-xs text-muted-foreground">response rate</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-medium">{street.optimal_window}</span>
                            <Badge className="text-xs">{street.optimal_response_rate}%</Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium ${getConfidenceColor(street.confidence)}`}>
                              {street.confidence.toFixed(0)}% confidence
                            </span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                                style={{ width: `${Math.min(street.confidence, 100)}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detail Panel */}
              <div>
                {selectedStreet ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{selectedStreet.street_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Overall Response Rate</p>
                        <p className="text-2xl font-bold text-green-600">{selectedStreet.overall_response_rate}%</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
                          Visit Time Windows
                        </p>
                        <div className="space-y-2">
                          {selectedStreet.all_windows.map((window, idx) => (
                            <div key={window.key} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className={`font-medium ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {window.label}
                                </span>
                                <span className="font-semibold">{window.response_rate}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    idx === 0 ? 'bg-green-500' : 'bg-blue-400'
                                  }`}
                                  style={{ width: `${Math.max(10, window.response_rate)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {window.sessions} session{window.sessions !== 1 ? 's' : ''} · {window.doors} doors
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-900 mb-1">💡 Recommendation</p>
                        <p className="text-sm text-green-800">
                          Best time to canvass <strong>{selectedStreet.street_name}</strong> is <strong>{selectedStreet.optimal_window}</strong> with expected <strong>{selectedStreet.optimal_response_rate}%</strong> positive responses.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <p className="text-sm">Select a street to see detailed recommendations</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Suggestions for Unassigned Turfs */}
            {unassignedTurfs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Optimization Suggestions for Unassigned Turfs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unassignedTurfs.slice(0, 5).map((turf) => {
                      // Find matching streets in patterns for this turf
                      const matchingStreets = patterns.filter(p =>
                        turf.name?.toLowerCase().includes(p.street_name.toLowerCase()) ||
                        p.street_name.toLowerCase().includes(turf.name?.toLowerCase())
                      );

                      const avgOptimalWindow = matchingStreets.length > 0
                        ? matchingStreets[0].optimal_window
                        : 'Afternoon (2pm-5pm)';

                      const avgResponseRate = matchingStreets.length > 0
                        ? Math.round(matchingStreets.reduce((sum, s) => sum + s.optimal_response_rate, 0) / matchingStreets.length)
                        : null;

                      return (
                        <div key={turf.id} className="p-4 rounded-lg border border-border bg-muted/20">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm">{turf.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {turf.contact_count || 0} contacts · {turf.priority || 'normal'} priority
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-sm text-blue-900">
                            <p className="font-medium mb-1">📅 Suggested Schedule</p>
                            <p>Visit <strong>{avgOptimalWindow}</strong></p>
                            {avgResponseRate && (
                              <p className="text-xs text-blue-800 mt-1">Expected response rate: ~{avgResponseRate}%</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}