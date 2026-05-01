import React from 'react';
import { AlertCircle, Zap, CheckCircle2, MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InfrastructureStatus({ 
  contactsNeedingGeocode, 
  totalContacts, 
  onGeocodeClick,
  onOptimizeClick,
  geocodingInProgress 
}) {
  const geocodePercentage = totalContacts > 0 
    ? Math.round(((totalContacts - contactsNeedingGeocode) / totalContacts) * 100) 
    : 0;

  return (
    <div className="space-y-3">
      {/* Geocoding Status */}
      <div className={`rounded-xl border p-4 flex items-start justify-between ${
        contactsNeedingGeocode === 0 
          ? 'bg-green-50 border-green-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          {contactsNeedingGeocode === 0 ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <MapPinOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-medium text-sm ${
              contactsNeedingGeocode === 0 ? 'text-green-900' : 'text-amber-900'
            }`}>
              Location Data: {geocodePercentage}% Complete
            </p>
            <p className={`text-xs mt-1 ${
              contactsNeedingGeocode === 0 ? 'text-green-700' : 'text-amber-700'
            }`}>
              {contactsNeedingGeocode === 0 
                ? `All ${totalContacts} contacts have location coordinates` 
                : `${contactsNeedingGeocode} contact${contactsNeedingGeocode !== 1 ? 's' : ''} need geocoding`}
            </p>
          </div>
        </div>
        {contactsNeedingGeocode > 0 && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onGeocodeClick}
            disabled={geocodingInProgress}
            className="whitespace-nowrap"
          >
            {geocodingInProgress ? 'Geocoding...' : 'Geocode Now'}
          </Button>
        )}
      </div>

      {/* Route Optimization Hint */}
      {totalContacts > 20 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-blue-900">Optimize Canvassing Routes</p>
              <p className="text-xs text-blue-700 mt-1">
                Intelligently group {totalContacts} contacts by postcode and minimize walking distance.
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onOptimizeClick}
            className="whitespace-nowrap"
          >
            Optimize Routes
          </Button>
        </div>
      )}
    </div>
  );
}