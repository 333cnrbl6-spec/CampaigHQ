import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import OrganizerLiveMap from '@/components/map/OrganizerLiveMap';

export default function OrganizerDashboard() {
  const { campaign } = useCampaign();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLiveData = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getLiveCanvassingData', {
        campaign_id: campaign?.id,
      });
      setData(response.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to load live data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (campaign?.id) {
      loadLiveData();
    }
  }, [campaign?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLiveData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, campaign?.id]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <MapPin className="w-8 h-8 text-primary" />
            Live Canvassing Coordinator
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time volunteer tracking and turf completion monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLiveData}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm">
            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Auto-refresh every 30 seconds {autoRefresh ? '(enabled)' : '(disabled)'}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">Failed to load live data: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Live Map */}
      {data && (
        <OrganizerLiveMap
          volunteers={data.active_volunteers || []}
          turfs={data.turf_progress || []}
          loading={loading}
        />
      )}

      {/* Campaign Summary */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Doors</p>
                <p className="text-3xl font-bold mt-1">{data.campaign_metrics.total_doors_knocked.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turfs Completed</p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {data.campaign_metrics.completed_turfs} / {data.campaign_metrics.total_turfs}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coverage</p>
                <p className="text-3xl font-bold mt-1 text-blue-600">
                  {data.campaign_metrics.total_turfs > 0
                    ? Math.round(
                        ((data.campaign_metrics.completed_turfs + data.campaign_metrics.in_progress_turfs) /
                          data.campaign_metrics.total_turfs) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>💡</span>
            Organizer Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-amber-900">
          <p>• Click on volunteer markers to view detailed canvassing progress and alert low battery levels</p>
          <p>• Turf colors indicate progress: Gray = Not started, Blue = In progress, Amber = Half way, Green = Completed</p>
          <p>• Use the sidebar to reassign volunteers between turfs or offer support to struggling teams</p>
          <p>• Monitor completion rates to ensure even distribution of work and meet daily targets</p>
        </CardContent>
      </Card>
    </div>
  );
}