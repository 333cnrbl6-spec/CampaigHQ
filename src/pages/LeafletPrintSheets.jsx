import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '@/lib/CampaignContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DataFetchError from '@/components/DataFetchError';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';
import { Printer, Download, MapPin, Home, FileText, AlertCircle } from 'lucide-react';
import LeafletPrintView from '@/components/leaflet/LeafletPrintView';

export default function LeafletPrintSheets() {
  const navigate = useNavigate();
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch turfs for campaign
  const { data: turfs = [], isLoading: turfLoading, error: turfError, refetch: refetchTurfs } = useQuery({
    queryKey: ['turfs', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Turf.list('-created_date', 1000);
        return Array.isArray(all) ? all.filter(t => t.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch turfs:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
  });

  // Fetch leaflet runs for campaign
  const { data: leafletRuns = [], isLoading: runLoading } = useQuery({
    queryKey: ['leaflet-runs', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.LeafletRun.list('-created_date', 5000);
        return Array.isArray(all) ? all.filter(r => r.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch leaflet runs:', err);
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
  });

  // Fetch contacts for street mapping
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-sheets', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Contact.list('-created_date', 50000);
        return Array.isArray(all) ? all.filter(c => c.campaign_id === campaignId) : [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
  });

  const handleGeneratePDF = async (turf) => {
    setSelectedTurf(turf);
    setGenerating(true);
  };

  const handleClosePreview = () => {
    setSelectedTurf(null);
    setGenerating(false);
  };

  // Get runs for selected turf
  const turfRuns = selectedTurf 
    ? leafletRuns.filter(r => r.turf_id === selectedTurf.id)
    : [];

  // Build street summary for selected turf
  const streetSummary = selectedTurf && turfRuns.length > 0 
    ? turfRuns.map(run => ({
        street_name: run.street_name,
        postcode: run.postcode,
        total_houses: run.total_houses || 0,
        postal_voter_houses: run.postal_voter_houses || 0,
        round_1_done: run.round_1_done || false,
        round_2_done: run.round_2_done || false,
        round_3_done: run.round_3_done || false,
        notes: run.notes || '',
      }))
    : [];

  if (selectedTurf && generating) {
    return (
      <LeafletPrintView 
        turf={selectedTurf}
        streets={streetSummary}
        contacts={contacts}
        onBack={handleClosePreview}
      />
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" /> Leaflet Print Sheets
        </h1>
        <p className="text-muted-foreground mt-1">Generate printable sheets for street-level leaflet distribution with checkboxes and map references</p>
      </div>

      {turfError && (
        <DataFetchError error={turfError} onRetry={refetchTurfs} />
      )}

      {turfLoading || runLoading ? (
        <ProcessingFeedback
          label="Loading turf and street data…"
          detail="Fetching turfs and leaflet routes for your campaign."
          tips={[
            'Each turf can contain multiple streets.',
            'Streets are organized by postal round for efficient delivery.',
          ]}
        />
      ) : turfs.length === 0 ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">No Turfs Found</h3>
            <p className="text-sm text-blue-800 mb-4">Create turfs first in Turf Management, then add streets via Legacy Map Import or manual entry.</p>
            <Button onClick={() => navigate('/turf')}>Go to Turf Management</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {turfs.map((turf) => {
            const turfStreets = leafletRuns.filter(r => r.turf_id === turf.id);
            const totalHouses = turfStreets.reduce((sum, s) => sum + (s.total_houses || 0), 0);
            const postalVoters = turfStreets.reduce((sum, s) => sum + (s.postal_voter_houses || 0), 0);
            
            return (
              <div key={turf.id} className="border border-border/50 rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
                {/* Turf name & status */}
                <div className="mb-3">
                  <h3 className="font-semibold text-base mb-1">{turf.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{turfStreets.length} streets</span>
                    <span className="mx-1">·</span>
                    <Home className="w-3 h-3" />
                    <span>{totalHouses} houses</span>
                  </div>
                </div>

                {/* Key details */}
                <div className="space-y-1.5 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Postal voters:</span>
                    <span className="font-medium text-foreground">{postalVoters}</span>
                  </div>
                  {turf.assigned_to && (
                    <div className="flex items-center justify-between">
                      <span>Assigned to:</span>
                      <span className="font-medium text-foreground">{turf.assigned_to}</span>
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {turf.status && (
                  <div className="mb-4 inline-flex items-center gap-2 px-2.5 py-1.5 bg-primary/10 rounded-md text-xs font-medium text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {turf.status}
                  </div>
                )}

                {/* Action button */}
                {turfStreets.length === 0 ? (
                  <Button variant="outline" disabled className="w-full gap-2">
                    <AlertCircle className="w-4 h-4" /> No streets imported
                  </Button>
                ) : (
                  <Button 
                    className="w-full gap-2"
                    onClick={() => handleGeneratePDF(turf)}
                  >
                    <Printer className="w-4 h-4" /> Generate PDF Sheet
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/50">
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <h4 className="font-semibold mb-2">What's Included</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Street directory with house counts</li>
              <li>✓ Postal voter breakdowns by round</li>
              <li>✓ Delivery tracking checkboxes</li>
              <li>✓ Small map thumbnail for reference</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <h4 className="font-semibold mb-2">Postal Rounds</h4>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li><strong>Round 1:</strong> All households in the turf</li>
              <li><strong>Round 2:</strong> Postal voters only (by post)</li>
              <li><strong>Round 3:</strong> Non-postal addresses (hand-delivery)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}