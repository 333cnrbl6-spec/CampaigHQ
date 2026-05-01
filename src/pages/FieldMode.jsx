import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Check, X, AlertCircle, WifiOff, Wifi, RefreshCw, CloudUpload, Search, Footprints } from 'lucide-react';
import { useOfflineFieldMode } from '../hooks/useOfflineFieldMode';
import { useGeolocation } from '@/hooks/useGeolocation';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import MobileContactCard from '@/components/field/MobileContactCard';
import MobileInteractionForm from '@/components/field/MobileInteractionForm';

const SUPPORT_LEVELS = {
  strong_supporter: { label: 'Strong Supporter', color: 'bg-green-100 text-green-800' },
  leaning: { label: 'Leaning', color: 'bg-blue-100 text-blue-800' },
  undecided: { label: 'Undecided', color: 'bg-yellow-100 text-yellow-800' },
  opposed: { label: 'Opposed', color: 'bg-red-100 text-red-800' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
};

export default function FieldMode() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);

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

  const { location, requestLocation, calculateDistance } = useGeolocation();

  // Request location on mount and periodically update volunteer location
  useEffect(() => {
    requestLocation();
    
    // Update location every 30 seconds while in field mode
    const interval = setInterval(() => {
      requestLocation();
      if (location) {
        base44.functions.invoke('updateVolunteerLocation', {
          latitude: location.latitude,
          longitude: location.longitude,
          postcode: contacts[currentIndex]?.postcode,
          turf_id: contacts[currentIndex]?.turf_id,
          turf_name: contacts[currentIndex]?.turf_name,
          current_contact_id: contacts[currentIndex]?.id,
          doors_knocked_today: currentIndex,
          battery_level: navigator.getBattery ? navigator.getBattery().then(b => b.level * 100) : null,
        }).catch(err => console.error('Location update failed:', err));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch interaction history for current contact
  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', contacts[currentIndex]?.id],
    queryFn: () => base44.entities.ContactInteraction.filter({ contact_id: contacts[currentIndex]?.id }, '-date', 10),
    enabled: !!contacts[currentIndex]?.id && isOnline,
  });

  // Sort contacts by proximity to field rep, then apply search
  const sortedByProximity = useMemo(() => {
    if (!location) return contacts;
    
    return [...contacts].sort((a, b) => {
      // Use UK postcode centroids as approximation (you'd want real geocoding for production)
      const getCoords = (postcode) => {
        // This is a simplified approach - in production you'd use a geocoding API
        const hash = postcode.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
        const lat = 53.5 + (Math.abs(hash % 1000) / 1000) * 0.3;
        const lon = -2.5 + (Math.abs(hash % 500) / 500) * 0.2;
        return [lat, lon];
      };

      const [lat1, lon1] = getCoords(a.postcode || '');
      const [lat2, lon2] = getCoords(b.postcode || '');
      const dist1 = calculateDistance(location.latitude, location.longitude, lat1, lon1);
      const dist2 = calculateDistance(location.latitude, location.longitude, lat2, lon2);
      return dist1 - dist2;
    });
  }, [contacts, location, calculateDistance]);

  // Search contacts by name, postcode, address
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return sortedByProximity;
    const query = searchQuery.toLowerCase();
    return sortedByProximity.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.postcode?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query)
    );
  }, [sortedByProximity, searchQuery]);

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

  const displayContacts = searchMode ? filteredContacts : contacts;
  const currentContact = displayContacts[currentIndex] || displayContacts[0];
  const progress = displayContacts.length > 0 ? Math.round((currentIndex / displayContacts.length) * 100) : 0;

  const handleLogInteraction = async (formData) => {
    setIsSubmittingInteraction(true);
    try {
      const interactionPayload = {
        contact_id: currentContact.id,
        type: 'door_knock',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        notes: formData.notes,
        outcome: formData.outcome,
      };

      const contactUpdatePayload = formData.support_level !== 'unknown' ? {
        id: currentContact.id,
        data: { support_level: formData.support_level, canvassed: true, canvass_date: new Date().toISOString().split('T')[0] }
      } : null;

      await logInteraction(interactionPayload, contactUpdatePayload);

      // Update volunteer location
      if (location) {
        base44.functions.invoke('updateVolunteerLocation', {
          latitude: location.latitude,
          longitude: location.longitude,
          postcode: currentContact.postcode,
          turf_id: currentContact.turf_id,
          turf_name: currentContact.turf_name,
          current_contact_id: currentContact.id,
          doors_knocked_today: (currentIndex + 1),
          battery_level: navigator.getBattery ? (await navigator.getBattery()).level * 100 : null,
        }).catch(err => console.error('Location update failed:', err));
      }

      setShowInteractionDialog(false);
      setCurrentIndex(i => Math.min(i + 1, displayContacts.length - 1));
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

        {/* Online/Offline status bar */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? '✓ Online' : '📱 Offline — syncing when connected'}</span>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">{queue.length} pending</span>
              {isOnline && (
                <button onClick={syncQueue} disabled={isSyncing} className="flex items-center gap-1 text-xs underline">
                  {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                  {isSyncing ? 'Syncing…' : 'Sync now'}
                </button>
              )}
            </div>
          )}
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
        {!searchMode && (
          <div className="relative">
            <Input
              placeholder="Search by name, postcode, address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchMode(e.target.value.trim().length > 0);
                setCurrentIndex(0);
              }}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* Search Results */}
        {searchMode && filteredContacts.length > 0 && (
          <div className="max-h-96 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
            {filteredContacts.map((contact, idx) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(idx)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  idx === currentIndex
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <p className="font-medium text-sm">{contact.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{contact.address}</p>
                {contact.postcode && <p className="text-xs text-muted-foreground">{contact.postcode}</p>}
              </button>
            ))}
          </div>
        )}

        {searchMode && filteredContacts.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No contacts found</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSearchMode(false); }} className="mt-2">
              Clear search
            </Button>
          </div>
        )}

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
              />
              </Card>
              </div>
              )}

        {/* Action Buttons — Mobile optimized */}
        {currentContact && !searchMode && (
          <div className="space-y-2 flex-shrink-0">
            <Button 
              className="w-full h-12 text-base gap-2" 
              onClick={() => setShowInteractionDialog(true)}
            >
              <Check className="w-5 h-5" /> Log Interaction
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-10" 
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} 
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-10" 
                onClick={() => setCurrentIndex(i => Math.min(displayContacts.length - 1, i + 1))} 
                disabled={currentIndex === displayContacts.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 h-10 text-destructive" 
                onClick={() => setCurrentIndex(i => Math.min(displayContacts.length - 1, i + 1))}
              >
                <X className="w-4 h-4" /> Skip
              </Button>
            </div>
          </div>
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

      </div>
    </div>
  );
}

// Remove unused SUPPORT_LEVELS constant at component level since it's in MobileContactCard