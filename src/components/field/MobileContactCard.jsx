import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Phone, MapPin, AlertCircle, Navigation } from 'lucide-react';

// Opens native maps app with walking directions to the address
export function openWalkingDirections(contact) {
  const addr = encodeURIComponent(`${contact.address}${contact.postcode ? ' ' + contact.postcode : ''}`);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    window.location.href = `maps://?daddr=${addr}&dirflg=w`;
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}&travelmode=walking`, '_blank');
  }
}

const SUPPORT_LEVELS = {
  strong_supporter: { label: '✓ Strong', color: 'bg-green-100 text-green-800' },
  leaning: { label: '~ Leaning', color: 'bg-blue-100 text-blue-800' },
  undecided: { label: '? Undecided', color: 'bg-yellow-100 text-yellow-800' },
  opposed: { label: '✗ Opposed', color: 'bg-red-100 text-red-800' },
  unknown: { label: '○ Unknown', color: 'bg-gray-100 text-gray-800' }
};

export default function MobileContactCard({ contact, index, total, stopNumber = null, nextContact = null, distanceMeters = null, arrived = false }) {
  return (
    <div className="space-y-3">
      {/* Progress & Stop Number */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {index + 1} of {total}
        </span>
        {stopNumber && (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {stopNumber}
          </span>
        )}
      </div>

      {/* Arrival banner */}
      {arrived && (
        <div className="flex items-center gap-2 bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-semibold animate-pulse">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          You have arrived at this address
        </div>
      )}

      {/* Name - Large for mobile */}
      <div>
        <h2 className="text-2xl font-bold font-heading">{contact.name}</h2>
      </div>

      {/* Essential Contact Info */}
      <div className="space-y-2 bg-secondary/40 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium text-base leading-tight">{contact.address}</p>
            {contact.postcode && (
              <p className="text-sm font-mono text-muted-foreground mt-1">{contact.postcode}</p>
            )}
          </div>
          <button
            onClick={() => openWalkingDirections(contact)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </button>
        </div>

        {contact.phone && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a href={`tel:${contact.phone}`} className="text-primary font-medium text-base hover:underline">
              {contact.phone}
            </a>
          </div>
        )}
      </div>

      {/* Support Status */}
      {contact.support_level && contact.support_level !== 'unknown' && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Current Status</p>
          <Badge className={SUPPORT_LEVELS[contact.support_level]?.color}>
            {SUPPORT_LEVELS[contact.support_level]?.label}
          </Badge>
        </div>
      )}

      {/* Last Visited */}
      {contact.canvassed && contact.canvass_date && (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg p-3 text-sm">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Last visited: <strong>{contact.canvass_date}</strong></span>
        </div>
      )}

      {/* Key Issues */}
      {contact.key_issues?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Key Concerns</p>
          <div className="flex flex-wrap gap-1">
            {contact.key_issues.map((issue) => (
              <Badge key={issue} variant="secondary" className="text-xs">
                {issue}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {contact.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Notes
          </p>
          <p className="text-sm text-amber-900">{contact.notes}</p>
        </div>
      )}

      {/* Next stop preview */}
      {nextContact && (
        <div className="border border-dashed border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-1">Next stop</p>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{nextContact.name}</p>
              <p className="text-xs text-muted-foreground truncate">{nextContact.address}{nextContact.postcode ? `, ${nextContact.postcode}` : ''}</p>
              {distanceMeters !== null && (
                <p className="text-xs text-primary font-medium mt-0.5">
                  ~{distanceMeters < 1000 ? `${Math.round(distanceMeters)}m` : `${(distanceMeters/1000).toFixed(1)}km`} away
                </p>
              )}
            </div>
            <button
              onClick={() => openWalkingDirections(nextContact)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 border border-blue-300 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 active:scale-95 transition-transform"
            >
              <Navigation className="w-3 h-3" />
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}