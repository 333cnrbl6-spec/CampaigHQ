import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download } from 'lucide-react';

export default function TargetListPreview({ targetList, contacts, onClose, onExport, onExportTurfs }) {
  // Group by support level
  const supportBreakdown = {
    strong_supporter: contacts.filter(c => c.support_level === 'strong_supporter').length,
    leaning: contacts.filter(c => c.support_level === 'leaning').length,
    undecided: contacts.filter(c => c.support_level === 'undecided').length,
    opposed: contacts.filter(c => c.support_level === 'opposed').length,
    unknown: contacts.filter(c => c.support_level === 'unknown' || !c.support_level).length,
  };

  // Group by turf
  const turfBreakdown = {};
  contacts.forEach(c => {
    const turf = (c.tags || [])[0] || 'Unassigned';
    turfBreakdown[turf] = (turfBreakdown[turf] || 0) + 1;
  });

  // Count registered voters
  const registeredVoters = contacts.filter(c => c.registered_voter).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{targetList.name}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {targetList.description && (
            <p className="text-sm text-muted-foreground">{targetList.description}</p>
          )}

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-2xl font-bold text-primary">{contacts.length}</div>
              <div className="text-xs text-muted-foreground">Total Contacts</div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-2xl font-bold text-green-600">{registeredVoters}</div>
              <div className="text-xs text-muted-foreground">Registered Voters</div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-center">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(turfBreakdown).length}</div>
              <div className="text-xs text-muted-foreground">Turfs</div>
            </div>
          </div>

          {/* Support breakdown */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Support Level Breakdown</h3>
            <div className="space-y-1.5">
              {Object.entries(supportBreakdown).map(([level, count]) => (
                count > 0 && (
                  <div key={level} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span className="capitalize">{level.replace('_', ' ')}</span>
                    <Badge>{count}</Badge>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Turf breakdown */}
          {Object.keys(turfBreakdown).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">By Turf</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {Object.entries(turfBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([turf, count]) => (
                    <div key={turf} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <span>{turf}</span>
                      <Badge>{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sample contacts */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Sample Contacts (first 10)</h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {contacts.slice(0, 10).map((c) => (
                <div key={c.id} className="p-2 bg-muted/20 rounded text-xs">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-muted-foreground">{c.address || 'No address'}</p>
                </div>
              ))}
              {contacts.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{contacts.length - 10} more
                </p>
              )}
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={onExportTurfs} className="gap-2">
              <Download className="w-4 h-4" />
              Export to Turfs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}