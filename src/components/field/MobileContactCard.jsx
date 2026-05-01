import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Phone, MapPin, AlertCircle } from 'lucide-react';

const SUPPORT_LEVELS = {
  strong_supporter: { label: '✓ Strong', color: 'bg-green-100 text-green-800' },
  leaning: { label: '~ Leaning', color: 'bg-blue-100 text-blue-800' },
  undecided: { label: '? Undecided', color: 'bg-yellow-100 text-yellow-800' },
  opposed: { label: '✗ Opposed', color: 'bg-red-100 text-red-800' },
  unknown: { label: '○ Unknown', color: 'bg-gray-100 text-gray-800' }
};

export default function MobileContactCard({ contact, index, total, stopNumber = null }) {
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

      {/* Name - Large for mobile */}
      <div>
        <h2 className="text-2xl font-bold font-heading">{contact.name}</h2>
      </div>

      {/* Essential Contact Info */}
      <div className="space-y-2 bg-secondary/40 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium text-base leading-tight">{contact.address}</p>
            {contact.postcode && (
              <p className="text-sm font-mono text-muted-foreground mt-1">{contact.postcode}</p>
            )}
          </div>
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
    </div>
  );
}