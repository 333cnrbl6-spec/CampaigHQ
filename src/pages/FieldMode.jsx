import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, AlertCircle, WifiOff, Wifi, RefreshCw, CloudUpload, Footprints, ShieldAlert } from 'lucide-react';
import { useOfflineFieldMode } from '../hooks/useOfflineFieldMode';
import { useGeolocation } from '@/hooks/useGeolocation';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import MobileContactCard, { openWalkingDirections } from '@/components/field/MobileContactCard';
import MobileInteractionForm from '@/components/field/MobileInteractionForm';
import FieldModeSearch from '@/components/field/FieldModeSearch';
import FieldModeActions from '@/components/field/FieldModeActions';
import WelfareCheckDialog from '@/components/field/WelfareCheckDialog';

// Haversine distance in meters
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const SUPPORT_LEVELS = {
  strong_supporter: { label: 'Strong Supporter', color: 'bg-green-100 text-green-800' },
  leaning: { label: 'Leaning', color: 'bg-blue-100 text-blue-800' },
  undecided: { label: 'Undecided', color: 'bg-yellow-100 text-yellow-800' },
  opposed: { label: 'Opposed', color: 'bg-red-100 text-red-800' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
};

export default function FieldMode() {
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);
  const [welfareCheckedIn, setWelfareCheckedIn] = useState(false);
  const [showWelfareAlert, setShowWelfareAlert] = useState(false);

  // Gate: check volunteer profile on mount — with defensive error handling
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) {
          setProfileChecked(true);
          return;
        }
        try {
          const profiles = await base44.entities.VolunteerProfile.filter({ user_email: user.email });
          const complete = Array.isArray(profiles) && profiles.some(p => p?.setup_complete && p?.gdpr_consent);
          setProfileComplete(complete);
        } catch (err) {
          console.error('Failed to fetch volunteer profile:', err);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setProfileChecked(true);
      }
    };
    checkProfile();
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const routeIdsParam = urlParams.get('route_ids');
  const routeIds = routeIdsParam ? routeIdsParam.split(',').filter(Boolean) : null;

  const {
    isOnline,
    contacts: allContacts,
    isLoadingContacts,
    queue,
    isSyncing,
    syncResult,
    cacheStatus,
    logInteraction,
    syncQueue,
  } = useOfflineFieldMode();

  // If route_ids param present, sort contacts into that exact order
  const contacts = useMemo(() => {
    if (!routeIds || allContacts.length === 0) return allContacts;
    const map = Object.fromEntries(allContacts.map(c => [c.id, c]));
    const ordered = routeIds.map(id => map[id]).filter(Boolean);
    // append any remaining contacts not in the route
    const inRoute = new Set(routeIds);
    const rest = allContacts.filter(c => !inRoute.has(c.id));
    return [...ordered, ...rest];
  }, [allContacts, routeIds]);

  // Sort contacts by proximity to field rep, then apply search
  const sortedByProximity = useMemo(() => {
    if (!contacts.length) return contacts;
    return contacts; // location-based sort happens after location is set
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return sortedByProximity;
    const query = searchQuery.toLowerCase();
    return sortedByProximity.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.postcode?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query)
    );
  }, [sortedByProximity, searchQuery]);

  const displayContacts = searchMode ? filteredContacts : contacts;
  const currentContact = displayContacts[currentIndex] || displayContacts[0];

  const { location, requestLocation, calculateDistance } = useGeolocation();

  // Request location on mount and periodically update volunteer location
  useEffect(() => {
    requestLocation();
    const interval = setInterval(async () => {
      try {
        requestLocation();
        if (location && currentContact?.id) {
          let battery = null;
          try {
            const batteryStatus = navigator.getBattery ? await navigator.getBattery().catch(() => null) : null;
            battery = batteryStatus?.level ? batteryStatus.level * 100 : null;
          } catch (err) {
            console.warn('Battery API unavailable:', err);
          }

          base44.functions.invoke('updateVolunteerLocation', {
            latitude: location.latitude,
            longitude: location.longitude,
            postcode: currentContact?.postcode || '',
            turf_id: currentContact?.turf_id || '',
            turf_name: currentContact?.turf_name || '',
            current_contact_id: currentContact.id,
            doors_knocked_today: currentIndex + 1,
            battery_level: battery,
            status: 'active',
          }).catch(err => console.warn('Location update failed:', err));
        }
      } catch (err) {
        console.error('Location update error:', err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [location, currentContact, currentIndex]);

  // Welfare check-in: if no check-in in 20 mins, show alert
  useEffect(() => {
    const welfareTimer = setTimeout(() => {
      if (!welfareCheckedIn) setShowWelfareAlert(true);
    }, 20 * 60 * 1000);
    return () => clearTimeout(welfareTimer);
  }, [welfareCheckedIn]);

  const { campaign } = useCampaign();

  // Fetch interaction history for current contact — with safe defaults
  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', campaign?.id, contacts[currentIndex]?.id],
    queryFn: async () => {
      try {
        const result = await base44.entities.ContactInteraction.list('-date', 100);
        return Array.isArray(result) ? result.filter(r => r.contact_id === contacts[currentIndex]?.id).slice(0, 10) : [];
      } catch (err) {
        console.error('Failed to fetch interactions:', err);
        return [];
      }
    },
    enabled: !!contacts[currentIndex]?.id && isOnline && !!campaign?.id,
  });

  const nextContact = displayContacts[currentIndex + 1] || null;
  const progress = displayContacts.length > 0 ? Math.round((currentIndex / displayContacts.length) * 100) : 0;

  // Arrival detection: check if within 25m of current contact's geocoords
  const arrived = useMemo(() => {
    if (!location || !currentContact?.latitude || !currentContact?.longitude) return false;
    return haversineMeters(location.latitude, location.longitude, currentContact.latitude, currentContact.longitude) < 25;
  }, [location, currentContact]);

  // Distance to next contact
  const nextDistanceMeters = useMemo(() => {
    if (!location || !nextContact?.latitude || !nextContact?.longitude) return null;
    return haversineMeters(location.latitude, location.longitude, nextContact.latitude, nextContact.longitude);
  }, [location, nextContact]);

  // Profile gate
  if (!profileChecked) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!profileComplete) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-6">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold font-heading">Profile Setup Required</h2>
            <p className="text-sm text-muted-foreground">
              Before going out canvassing, we need a few details from you — including an emergency contact and your consent to location sharing for welfare purposes.
            </p>
            <p className="text-xs text-muted-foreground">This takes about 2 minutes.</p>
            <Button className="w-full" onClick={() => window.location.href = '/volunteer-setup'}>
              Complete My Profile →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingContacts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-muted-foreground">No contacts to canvass</p>
            {!isOnline && <p className="text-xs text-muted-foreground mt-1">You're offline — connect to load contacts.</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogInteraction = async (formData) => {
    if (!currentContact?.id) {
      console.error('No current contact');
      return;
    }
    setIsSubmittingInteraction(true);
    try {
      const interactionPayload = {
        contact_id: currentContact.id,
        type: 'door_knock',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        notes: formData?.notes || '',
        outcome: formData?.outcome || 'no_answer',
      };

      const contactUpdatePayload = formData?.support_level && formData.support_level !== 'unknown' ? {
        id: currentContact.id,
        data: { support_level: formData.support_level, canvassed: true, canvass_date: new Date().toISOString().split('T')[0] }
      } : null;

      await logInteraction(interactionPayload, contactUpdatePayload);

      // Update volunteer location
      if (location?.latitude && location?.longitude && currentContact?.id) {
        try {
          let battery = null;
          try {
            const batteryStatus = navigator.getBattery ? await navigator.getBattery().catch(() => null) : null;
            battery = batteryStatus?.level ? batteryStatus.level * 100 : null;
          } catch (err) {
            console.warn('Battery API unavailable:', err);
          }

          await base44.functions.invoke('updateVolunteerLocation', {
            latitude: location.latitude,
            longitude: location.longitude,
            postcode: currentContact.postcode || '',
            turf_id: currentContact.turf_id || '',
            turf_name: currentContact.turf_name || '',
            current_contact_id: currentContact.id,
            doors_knocked_today: (currentIndex + 1),
            battery_level: battery,
            status: 'active',
          });
        } catch (err) {
          console.warn('Location update failed:', err);
        }
      }

      setShowInteractionDialog(false);
      setCurrentIndex(i => Math.min(i + 1, displayContacts.length - 1));
    } catch (err) {
      console.error('Interaction logging failed:', err);
      alert('Failed to log interaction — check your internet connection');
    } finally {
      setIsSubmittingInteraction(false);
    }
  };

  const handleSelectContact = (index) => {
    setCurrentIndex(index);
    setSearchMode(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 flex flex-col">
      <div className="w-full space-y-3 flex-1 flex flex-col">

        {/* Route mode banner */}
        {routeIds && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20">
            <Footprints className="w-4 h-4 flex-shrink-0" />
            <span>Route mode — {routeIds.length} stops in optimised order</span>
          </div>
        )}

        {/* Online/Offline status bar with sync queue */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isOnline && queue.length === 0 ? 'bg-green-50 text-green-700 border border-green-200' : isOnline ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? (queue.length === 0 ? '✓ Connected' : '⚡ Connected — syncing') : '📱 Offline Mode'}</span>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isSyncing ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'}`}>
                {isSyncing ? 'Syncing...' : `${queue.length} queued`}
              </span>
            )}
            {isOnline && queue.length > 0 && !isSyncing && (
              <button onClick={syncQueue} className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity">
                <CloudUpload className="w-3 h-3" />
                Sync
              </button>
            )}
          </div>
        </div>

        {/* Sync result toast */}
        {syncResult && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            Synced {syncResult.synced} record{syncResult.synced !== 1 ? 's' : ''}
            {syncResult.failed > 0 && ` · ${syncResult.failed} failed`}
          </div>
        )}

        {/* Search Bar */}
        <FieldModeSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSearchMode={setSearchMode}
          filteredContacts={filteredContacts}
          currentIndex={currentIndex}
          onSelectContact={handleSelectContact}
        />

        {/* Progress Bar */}
        {!searchMode && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold font-heading">Door Knocking</h1>
              <span className="text-sm font-medium text-muted-foreground">{currentIndex + 1} of {displayContacts.length}</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
          </div>
        )}

        {/* Contact Card — Mobile-first layout */}
        {!currentContact && searchMode && (
          <div className="text-center py-8 text-muted-foreground text-sm">Select a contact from search.</div>
        )}
        {currentContact && (
          <div className="flex-1 overflow-y-auto mb-4">
            <Card className="sticky top-0">
              <MobileContactCard 
                contact={currentContact}
                index={currentIndex}
                total={displayContacts.length}
                stopNumber={routeIds ? routeIds.indexOf(currentContact.id) + 1 : null}
                nextContact={nextContact}
                distanceMeters={nextDistanceMeters}
                arrived={arrived}
              />
            </Card>
          </div>
        )}

        {/* Action Buttons — Mobile optimized */}
        {currentContact && !searchMode && (
          <FieldModeActions 
            onLogInteraction={() => setShowInteractionDialog(true)}
            onPrevious={() => setCurrentIndex(i => Math.max(0, i - 1))}
            onNext={() => setCurrentIndex(i => Math.min(displayContacts.length - 1, i + 1))}
            onSkip={() => setCurrentIndex(i => Math.min(displayContacts.length - 1, i + 1))}
            onWelfareCheckIn={() => { setWelfareCheckedIn(true); setShowWelfareAlert(false); }}
            onDirections={() => openWalkingDirections(currentContact)}
            canGoPrevious={currentIndex > 0}
            canGoNext={currentIndex < displayContacts.length - 1}
            welfareCheckedIn={welfareCheckedIn}
            isSubmitting={isSubmittingInteraction}
          />
        )}

        {/* Interaction Dialog - Mobile optimized */}
        <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
          <DialogContent className="w-full max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Log Interaction — {currentContact?.name}</DialogTitle>
            </DialogHeader>
            <MobileInteractionForm
              contact={currentContact}
              onSubmit={handleLogInteraction}
              isOnline={isOnline}
              isLoading={isSubmittingInteraction}
            />
          </DialogContent>
        </Dialog>

        {/* Welfare check-in alert */}
        <WelfareCheckDialog 
          open={showWelfareAlert}
          onOpenChange={setShowWelfareAlert}
          onCheckIn={() => { setWelfareCheckedIn(true); setShowWelfareAlert(false); }}
        />

      </div>
    </div>
  );
}

// Remove unused SUPPORT_LEVELS constant at component level since it's in MobileContactCard