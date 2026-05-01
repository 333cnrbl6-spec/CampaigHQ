import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Navigation2, Phone, MapPin, User } from 'lucide-react';

export default function TurnByTurnNav({ 
  route, 
  currentStopIndex = 0, 
  userLocation, 
  onContactClick,
  onNavigateClick 
}) {
  if (!route || route.length === 0) return null;

  const currentStop = route[currentStopIndex];
  const nextStop = route[currentStopIndex + 1];
  const progress = Math.round(((currentStopIndex + 1) / route.length) * 100);

  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  };

  const distanceToNext = userLocation && nextStop?.coords
    ? calcDistance(userLocation[0], userLocation[1], nextStop.coords[0], nextStop.coords[1])
    : null;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="bg-card rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Route Progress</span>
          <span className="text-sm font-bold text-primary">{currentStopIndex + 1} of {route.length}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progress}% complete</p>
      </div>

      {/* Current Stop */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {currentStopIndex + 1}
              </div>
              <div>
                <p className="text-sm font-semibold">Current Stop</p>
                <p className="text-xs text-muted-foreground mt-1">Knock here now</p>
              </div>
            </div>
            <Badge variant="default">Active</Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{currentStop.contact.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentStop.contact.address}</p>
              </div>
            </div>
            {currentStop.contact.postcode && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono">{currentStop.contact.postcode}</span>
              </div>
            )}
            {currentStop.contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${currentStop.contact.phone}`} className="text-xs text-primary hover:underline">
                  {currentStop.contact.phone}
                </a>
              </div>
            )}
          </div>

          <Button
            onClick={() => onContactClick?.(currentStop.contact)}
            variant="outline"
            className="w-full text-xs"
          >
            View & Log Interaction
          </Button>
        </CardContent>
      </Card>

      {/* Next Stop */}
      {nextStop && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {currentStopIndex + 2}
                </div>
                <div>
                  <p className="text-sm font-semibold">Next Stop</p>
                  {distanceToNext && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {distanceToNext} km away
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{nextStop.contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{nextStop.contact.address}</p>
                </div>
              </div>
              {nextStop.contact.postcode && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-mono">{nextStop.contact.postcode}</span>
                </div>
              )}
            </div>

            {nextStop.coords && (
              <Button
                onClick={() => onNavigateClick?.(nextStop.coords)}
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                Open in Maps
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Route Summary */}
      <div className="bg-card rounded-lg p-3 text-xs space-y-1 text-muted-foreground">
        <p><strong>{route.length}</strong> total doors on this route</p>
        <p><strong>{route.length - currentStopIndex - 1}</strong> remaining after this stop</p>
        {route[route.length - 1] && (
          <p>Final stop: <strong>{route[route.length - 1].contact.name}</strong></p>
        )}
      </div>
    </div>
  );
}