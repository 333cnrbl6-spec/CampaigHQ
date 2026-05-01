import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, MapPin } from 'lucide-react';

export default function UnassignedStreetsOverlay({ contacts = [], turfs = [] }) {
  const streetSummary = useMemo(() => {
    const summary = {};

    contacts.forEach(contact => {
      if (!contact.address) return;

      // Extract street name (first part of address before house number)
      const street = contact.address.split(/,|\d/)[0].trim();
      
      // Check if contact has a turf assignment
      const turfAssigned = contact.tags?.some(tag => 
        turfs.some(t => t.name === tag && (t.assigned_to || t.assigned_team?.length > 0))
      );

      if (!summary[street]) {
        summary[street] = { total: 0, unassigned: 0, postcode: contact.postcode };
      }
      summary[street].total += 1;
      if (!turfAssigned) {
        summary[street].unassigned += 1;
      }
    });

    // Sort by unassigned count
    return Object.entries(summary)
      .map(([street, data]) => ({ street, ...data }))
      .sort((a, b) => b.unassigned - a.unassigned);
  }, [contacts, turfs]);

  const totalUnassigned = streetSummary.reduce((sum, s) => sum + s.unassigned, 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {totalUnassigned} contacts in unassigned turfs
          </p>
          <p className="text-xs text-amber-700">
            {streetSummary.filter(s => s.unassigned > 0).length} streets affected
          </p>
        </div>
      </div>

      {/* Streets list */}
      <div className="max-h-96 overflow-y-auto space-y-1">
        {streetSummary.map(street => (
          <div
            key={street.street}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              street.unassigned > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {street.unassigned > 0 ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
                <p className="text-sm font-medium truncate">{street.street}</p>
              </div>
              {street.postcode && (
                <p className="text-xs text-muted-foreground ml-6">{street.postcode}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
              {street.unassigned > 0 && (
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {street.unassigned}/{street.total}
                </Badge>
              )}
              {street.unassigned === 0 && (
                <Badge variant="outline" className="text-xs text-green-700 whitespace-nowrap">
                  ✓ {street.total}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {streetSummary.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <MapPin className="w-8 h-8 opacity-20 mx-auto mb-2" />
          <p className="text-sm">No contact data to analyze</p>
        </div>
      )}
    </div>
  );
}