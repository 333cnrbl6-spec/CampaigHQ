import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Phone, MessageCircle, CheckCircle2, ArrowUp, Navigation, Home } from 'lucide-react';
import TurnByTurnNav from '@/components/navigation/TurnByTurnNav';
import RouteNavigationMap from '@/components/map/RouteNavigationMap';
import MobileContactCard from '@/components/field/MobileContactCard';
import MobileInteractionForm from '@/components/field/MobileInteractionForm';

export default function FieldNavigation() {
  const [searchParams] = useSearchParams();
  const routeIds = searchParams.get('route_ids')?.split(',') || [];
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  // Get geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => console.warn('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Monitor online/offline
  useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  // Build route from contact IDs
  useEffect(() => {
    if (routeIds.length > 0 && contacts.length > 0) {
      const routeContacts = routeIds
        .map(id => contacts.find(c => c.id === id))
        .filter(Boolean);

      if (routeContacts.length > 0) {
        const stops = routeContacts.map(contact => ({
          contact,
          coords: null, // Will be populated if contact has geolocation data
        }));
        setRoute(stops);
      }
    }
  }, [routeIds, contacts]);

  const handleContactClick = useCallback((contact) => {
    setShowInteractionForm(true);
  }, []);

  const handleNavigateClick = useCallback((coords) => {
    const mapsUrl = `https://maps.google.com/maps?q=${coords[0]},${coords[1]}`;
    window.open(mapsUrl, '_blank');
  }, []);

  const handleNextStop = () => {
    if (currentStopIndex < route.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
      setShowInteractionForm(false);
    }
  };

  const handlePrevStop = () => {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(currentStopIndex - 1);
      setShowInteractionForm(false);
    }
  };

  const handleLogInteraction = async (outcome, notes) => {
    const contact = route[currentStopIndex].contact;
    
    try {
      if (selectedSupport) {
        await base44.entities.Contact.update(contact.id, {
          support_level: selectedSupport,
        });
      }

      await base44.entities.ContactInteraction.create({
        contact_id: contact.id,
        type: 'door_knock',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        notes,
        outcome,
        logged_by: (await base44.auth.me()).email,
      });

      setShowInteractionForm(false);
      setSelectedSupport(null);
      handleNextStop();
    } catch (error) {
      alert('Error logging interaction: ' + error.message);
    }
  };

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4 bg-background">
        <MapPin className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-center text-muted-foreground">No route loaded. Use "Plan Route" from Contacts to start navigation.</p>
        <Button onClick={() => window.location.href = '/contacts'}>
          Back to Contacts
        </Button>
      </div>
    );
  }

  const currentContact = route[currentStopIndex]?.contact;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="font-heading text-lg font-bold">Field Navigation</h1>
          <p className="text-xs text-muted-foreground">Stop {currentStopIndex + 1} of {route.length}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="destructive" className="text-xs">Offline</Badge>
          )}
          {userLocation && (
            <Badge variant="secondary" className="text-xs">📍 Tracking</Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = '/contacts'}
            className="gap-1.5 text-xs"
          >
            <Home className="w-3.5 h-3.5" />
            Exit
          </Button>
        </div>
      </div>

      {/* Map + Navigation Split */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Map */}
        <div className="flex-1 rounded-lg overflow-hidden border border-border shadow-sm hidden lg:block">
          <RouteNavigationMap 
            route={route} 
            currentStopIndex={currentStopIndex} 
            userLocation={userLocation}
          />
        </div>

        {/* Navigation Sidebar */}
        <div className="w-full lg:w-96 overflow-y-auto space-y-4 flex flex-col">
          {/* Turn-by-turn */}
          <TurnByTurnNav
            route={route}
            currentStopIndex={currentStopIndex}
            userLocation={userLocation}
            onContactClick={handleContactClick}
            onNavigateClick={handleNavigateClick}
          />

          {/* Navigation Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handlePrevStop}
              disabled={currentStopIndex === 0}
              variant="outline"
              className="flex-1 gap-2 text-xs"
            >
              ← Previous
            </Button>
            <Button
              onClick={handleNextStop}
              disabled={currentStopIndex === route.length - 1}
              className="flex-1 gap-2 text-xs"
            >
              Next →
            </Button>
          </div>

          {/* Quick Actions */}
          {currentContact && (
            <div className="bg-card rounded-lg p-3 space-y-2 text-sm">
              <p className="font-semibold mb-2">Quick Actions</p>
              {currentContact.phone && (
                <a
                  href={`tel:${currentContact.phone}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
              {currentContact.email && (
                <a
                  href={`mailto:${currentContact.email}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  Email
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interaction Form Dialog */}
      <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
          </DialogHeader>
          
          {currentContact && (
            <div className="space-y-4">
              <MobileContactCard contact={currentContact} />

              {/* Support Level Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Support Level</label>
                <Select value={selectedSupport || ''} onValueChange={setSelectedSupport}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select if changed..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong_supporter">Strong Supporter</SelectItem>
                    <SelectItem value="leaning">Leaning</SelectItem>
                    <SelectItem value="undecided">Undecided</SelectItem>
                    <SelectItem value="opposed">Opposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <MobileInteractionForm
                onSubmit={(outcome, notes) => handleLogInteraction(outcome, notes)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}