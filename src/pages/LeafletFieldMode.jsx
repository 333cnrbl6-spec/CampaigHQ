import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Home, CheckCircle2, Navigation, ChevronLeft, ChevronRight,
  MapPin, Leaf, ShieldAlert, Users, Clock, Wifi, WifiOff, Package
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import WelfareCheckDialog from '@/components/field/WelfareCheckDialog';

function openWalkingDirections(street) {
  const addr = encodeURIComponent(`${street.street_name}${street.postcode ? ', ' + street.postcode : ''}`);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    window.location.href = `maps://?daddr=${addr}&dirflg=w`;
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=walking`, '_blank');
  }
}

const ROUND_LABELS = {
  1: { label: 'Round 1', desc: 'All households', color: 'bg-blue-600' },
  2: { label: 'Round 2', desc: 'Postal voters only', color: 'bg-purple-600' },
  3: { label: 'Round 3', desc: 'Non-postal households', color: 'bg-amber-600' },
};

export default function LeafletFieldMode() {
  const { campaign } = useCampaign();
  const queryClient = useQueryClient();
  const { location, requestLocation } = useGeolocation();

  const [activeRound, setActiveRound] = useState(null); // null = choose round first
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [welfareCheckedIn, setWelfareCheckedIn] = useState(false);
  const [showWelfareAlert, setShowWelfareAlert] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedStreet, setSelectedStreet] = useState(null);

  useEffect(() => {
    requestLocation();
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Welfare check timer
  useEffect(() => {
    if (!activeRound) return;
    const timer = setTimeout(() => {
      if (!welfareCheckedIn) setShowWelfareAlert(true);
    }, 20 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [activeRound, welfareCheckedIn]);

  const { data: allRuns = [], isLoading } = useQuery({
    queryKey: ['leaflet-field-runs', campaign?.id],
    queryFn: () => base44.entities.LeafletRun.filter({ campaign_id: campaign?.id }, 'street_name', 500),
    enabled: !!campaign?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeafletRun.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaflet-field-runs'] }),
  });

  // Filter runs relevant to selected round and not yet done
  const runs = allRuns.filter(r => {
    if (!activeRound) return false;
    const roundKey = `round_${activeRound}_done`;
    if (r[roundKey]) return false; // already done
    if (activeRound === 2 && (r.postal_voter_houses || 0) === 0) return false; // no postal addresses
    return true;
  });

  const currentStreet = runs[currentIndex] || runs[0];
  const progress = runs.length > 0 ? Math.round((currentIndex / runs.length) * 100) : 0;

  const totalHousesForRound = (street) => {
    if (!street || !activeRound) return 0;
    if (activeRound === 1) return street.total_houses || 0;
    if (activeRound === 2) return street.postal_voter_houses || 0;
    if (activeRound === 3) return (street.total_houses || 0) - (street.postal_voter_houses || 0);
    return 0;
  };

  const markStreetDone = useCallback((street) => {
    if (!street || !activeRound) return;
    const roundKey = `round_${activeRound}_done`;
    updateMutation.mutate({ id: street.id, data: { [roundKey]: true, status: 'in_progress' } });
    setCurrentIndex(i => Math.min(i + 1, runs.length - 1));
  }, [activeRound, runs.length, updateMutation]);

  const markStreetSkipped = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, runs.length - 1));
  }, [runs.length]);

  // Round Selection Screen
  if (!activeRound) {
    const roundStats = [1, 2, 3].map(r => ({
      round: r,
      total: allRuns.length,
      done: allRuns.filter(x => x[`round_${r}_done`]).length,
      remaining: allRuns.filter(x => !x[`round_${r}_done`] && (r !== 2 || (x.postal_voter_houses || 0) > 0)).length,
    }));

    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground px-5 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <Leaf className="w-6 h-6" />
            <h1 className="text-xl font-bold font-heading">Leaflet Drop</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">Select your round to begin</p>
        </div>

        <div className="px-4 py-6 space-y-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Online — updates save in real time' : 'Offline — updates will sync when reconnected'}</span>
          </div>

          {roundStats.map(({ round, done, remaining }) => {
            const config = ROUND_LABELS[round];
            return (
              <button
                key={round}
                onClick={() => { setActiveRound(round); setCurrentIndex(0); }}
                className="w-full text-left bg-card border border-border/60 rounded-2xl p-5 active:scale-95 transition-transform shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {round}
                    </div>
                    <div>
                      <p className="font-bold text-base">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-muted-foreground">{remaining} remaining</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">{done} done</span>
                  </div>
                </div>
                {remaining > 0 && (
                  <div className="mt-3 bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.round((done / (done + remaining)) * 100)}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}

          {/* Safety reminder */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              You'll be prompted for a welfare check-in every 20 minutes. Always let your team lead know before you head out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Session Complete Screen
  if (runs.length === 0 && activeRound) {
    const config = ROUND_LABELS[activeRound];
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div className={`w-20 h-20 rounded-full ${config.color} flex items-center justify-center`}>
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-heading">{config.label} Complete!</h2>
          <p className="text-muted-foreground mt-2">All streets for {config.desc} are marked as done.</p>
        </div>
        <Button onClick={() => setActiveRound(null)} className="w-full max-w-xs h-12">
          Back to Round Selection
        </Button>
      </div>
    );
  }

  const config = ROUND_LABELS[activeRound];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Bar */}
      <div className={`${config.color} text-white px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveRound(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="font-bold text-sm">{config.label} — {config.desc}</p>
              <p className="text-white/70 text-xs">{currentIndex + 1} of {runs.length} streets</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{progress}%</p>
            <p className="text-white/70 text-[10px]">complete</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 bg-white/20 rounded-full h-1.5">
          <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Online status */}
      <div className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium ${isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{isOnline ? 'Online' : 'Offline — will sync when connected'}</span>
      </div>

      {/* Street Card */}
      {currentStreet && (
        <div className="flex-1 px-4 py-4 space-y-4">
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
            {/* Street Name */}
            <div className="p-5 border-b border-border/40">
              <h2 className="text-2xl font-bold font-heading leading-tight">{currentStreet.street_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {currentStreet.area && (
                  <Badge variant="secondary" className="text-xs">{currentStreet.area}</Badge>
                )}
                {currentStreet.postcode && (
                  <span className="text-sm text-muted-foreground font-mono">{currentStreet.postcode}</span>
                )}
                {currentStreet.turf_part && (
                  <Badge variant="outline" className="text-xs">Part {currentStreet.turf_part}</Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x divide-border/40">
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-xs">To Deliver</span>
                </div>
                <p className="text-3xl font-bold text-primary">{totalHousesForRound(currentStreet)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeRound === 2 ? 'postal addresses' : activeRound === 3 ? 'non-postal' : 'households'}
                </p>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Assigned To</span>
                </div>
                <p className="text-sm font-semibold text-center leading-tight">
                  {currentStreet.assigned_to || 'Unassigned'}
                </p>
              </div>
            </div>

            {/* Directions button */}
            <div className="p-4 pt-0">
              <button
                onClick={() => openWalkingDirections(currentStreet)}
                className="w-full flex items-center justify-center gap-2 h-11 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              >
                <Navigation className="w-4 h-4" />
                Get Walking Directions
              </button>
            </div>

            {/* Notes */}
            {currentStreet.notes && (
              <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">Notes</p>
                <p className="text-sm text-amber-900">{currentStreet.notes}</p>
              </div>
            )}
          </div>

          {/* Next street preview */}
          {runs[currentIndex + 1] && (
            <div className="border border-dashed border-border rounded-xl p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Up next</p>
              <p className="font-semibold text-sm">{runs[currentIndex + 1].street_name}</p>
              <p className="text-xs text-muted-foreground">{runs[currentIndex + 1].area}{runs[currentIndex + 1].postcode ? ` · ${runs[currentIndex + 1].postcode}` : ''}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons — sticky bottom */}
      <div className="sticky bottom-0 bg-background border-t border-border/50 px-4 pt-3 pb-6 space-y-2">
        {/* Main action */}
        <Button
          onClick={() => markStreetDone(currentStreet)}
          disabled={updateMutation.isPending}
          className="w-full h-14 text-base gap-2 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="w-5 h-5" />
          {updateMutation.isPending ? 'Saving...' : 'Mark Street Done ✓'}
        </Button>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm"
            onClick={markStreetSkipped}
            disabled={currentIndex >= runs.length - 1}
          >
            Skip for Now
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        </div>

        {/* Welfare check-in */}
        <button
          onClick={() => { setWelfareCheckedIn(true); setShowWelfareAlert(false); }}
          className={`w-full h-9 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
            welfareCheckedIn
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {welfareCheckedIn ? '✓ Safety check-in sent' : "Tap to confirm you're safe"}
        </button>
      </div>

      {/* Welfare Alert Dialog */}
      <WelfareCheckDialog
        open={showWelfareAlert}
        onOpenChange={setShowWelfareAlert}
        onCheckIn={() => { setWelfareCheckedIn(true); setShowWelfareAlert(false); }}
      />
    </div>
  );
}