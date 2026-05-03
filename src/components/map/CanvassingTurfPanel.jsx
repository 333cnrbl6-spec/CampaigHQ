import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, MapPin, Users, Home, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CanvassingTurfPanel({ turf, contacts = [], logs = [], onClose }) {
  // Get contacts assigned to this turf
  const turfContacts = useMemo(() => {
    if (!turf) return [];
    return contacts.filter(c => 
      c.tags?.includes(turf.name) || c.address?.includes(turf.name)
    );
  }, [contacts, turf]);

  // Get canvassing progress for this turf
  const turfLogs = useMemo(() => {
    if (!turf) return [];
    return logs.filter(l => l.turf_id === turf.id);
  }, [logs, turf]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!turf) {
      return {
        totalDoors: 0,
        totalPositive: 0,
        totalNegative: 0,
        sessions: 0,
        volunteers: 0,
        canvassedContacts: 0,
        coverage: 0,
        supportBreakdown: { strong_supporter: 0, leaning: 0, undecided: 0, opposed: 0 },
      };
    }
    const totalDoors = turfLogs.reduce((sum, l) => sum + (l.doors_knocked || 0), 0);
    const totalPositive = turfLogs.reduce((sum, l) => sum + (l.positive_responses || 0), 0);
    const totalNegative = turfLogs.reduce((sum, l) => sum + (l.negative_responses || 0), 0);
    const sessions = turfLogs.length;
    const volunteers = new Set(turfLogs.map(l => l.volunteer_email)).size;
    
    const canvassedContacts = turfContacts.filter(c => c.canvassed).length;
    const coverage = turfContacts.length > 0 ? Math.round((canvassedContacts / turfContacts.length) * 100) : 0;

    // Support breakdown
    const supportBreakdown = {
      strong_supporter: turfContacts.filter(c => c.support_level === 'strong_supporter').length,
      leaning: turfContacts.filter(c => c.support_level === 'leaning').length,
      undecided: turfContacts.filter(c => c.support_level === 'undecided').length,
      opposed: turfContacts.filter(c => c.support_level === 'opposed').length,
    };

    return {
      totalDoors,
      totalPositive,
      totalNegative,
      sessions,
      volunteers,
      canvassedContacts,
      coverage,
      supportBreakdown,
    };
  }, [turfLogs, turfContacts, turf]);

  if (!turf) return null;

  // Priority badge color
  const priorityColors = {
    urgent: 'bg-red-100 text-red-900',
    high: 'bg-orange-100 text-orange-900',
    normal: 'bg-blue-100 text-blue-900',
  };

  // Status badge
  const statusColors = {
    unassigned: 'bg-gray-100 text-gray-900',
    assigned: 'bg-blue-100 text-blue-900',
    in_progress: 'bg-yellow-100 text-yellow-900',
    completed: 'bg-green-100 text-green-900',
  };

  return (
    <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-32px)] bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg overflow-y-auto z-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/98 border-b border-border p-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {turf.name}
          </h3>
          <div className="flex gap-2 mt-2">
            {turf.priority && (
              <Badge className={cn('text-xs capitalize', priorityColors[turf.priority] || priorityColors.normal)}>
                {turf.priority}
              </Badge>
            )}
            <Badge className={cn('text-xs capitalize', statusColors[turf.status] || statusColors.unassigned)}>
              {turf.status}
            </Badge>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <CardContent className="space-y-5 p-4">
        {/* Assignment */}
        {turf.assigned_to && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium mb-1">Assigned To</p>
            <p className="text-sm font-semibold text-green-900">{turf.assigned_to}</p>
          </div>
        )}

        {turf.assigned_team && turf.assigned_team.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-2">Team Members</p>
            <div className="flex flex-wrap gap-1">
              {turf.assigned_team.map((member, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {member}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.coverage}%</div>
            <div className="text-xs text-muted-foreground mt-1">Coverage</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalDoors}</div>
            <div className="text-xs text-muted-foreground mt-1">Doors Knocked</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.sessions}</div>
            <div className="text-xs text-muted-foreground mt-1">Sessions</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.volunteers}</div>
            <div className="text-xs text-muted-foreground mt-1">Volunteers</div>
          </div>
        </div>

        {/* Contacts Summary */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Home className="w-4 h-4" />
            Contacts ({turfContacts.length})
          </h4>
          
          {turfContacts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No contacts assigned to this turf</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {turfContacts.slice(0, 10).map((contact) => (
                <div key={contact.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{contact.address}</p>
                  </div>
                  {contact.canvassed && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
              {turfContacts.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{turfContacts.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Support Breakdown */}
        {Object.values(stats.supportBreakdown).some(v => v > 0) && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Support Levels</h4>
            <div className="space-y-1.5 text-xs">
              {stats.supportBreakdown.strong_supporter > 0 && (
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span>Strong Supporters</span>
                  <Badge variant="secondary" className="bg-green-200 text-green-900">{stats.supportBreakdown.strong_supporter}</Badge>
                </div>
              )}
              {stats.supportBreakdown.leaning > 0 && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span>Leaning</span>
                  <Badge variant="secondary" className="bg-blue-200 text-blue-900">{stats.supportBreakdown.leaning}</Badge>
                </div>
              )}
              {stats.supportBreakdown.undecided > 0 && (
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span>Undecided</span>
                  <Badge variant="secondary" className="bg-yellow-200 text-yellow-900">{stats.supportBreakdown.undecided}</Badge>
                </div>
              )}
              {stats.supportBreakdown.opposed > 0 && (
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span>Opposed</span>
                  <Badge variant="secondary" className="bg-red-200 text-red-900">{stats.supportBreakdown.opposed}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {turf.notes && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Notes</p>
            <p className="text-xs text-foreground">{turf.notes}</p>
          </div>
        )}
      </CardContent>
    </div>
  );
}