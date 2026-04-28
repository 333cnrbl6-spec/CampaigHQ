import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ShiftCard({ shift, signupCount, isSignedUp, onSignUp, onCancel }) {
  const capacityFull = signupCount >= shift.capacity;
  const spotsLeft = shift.capacity - signupCount;

  const statusColors = {
    scheduled: 'bg-blue-50 border-blue-200',
    in_progress: 'bg-yellow-50 border-yellow-200',
    completed: 'bg-green-50 border-green-200',
    cancelled: 'bg-red-50 border-red-200',
  };

  const statusText = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <Card className={`${statusColors[shift.status]} border`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-base">{shift.title}</CardTitle>
          <Badge variant={shift.status === 'scheduled' ? 'default' : 'secondary'}>
            {statusText[shift.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Date & Time</p>
              <p className="font-medium">
                {format(new Date(shift.date), 'MMM d, yyyy')} {shift.start_time}-{shift.end_time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Location</p>
              <p className="font-medium">{shift.location}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {shift.description && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
            {shift.description}
          </div>
        )}

        {/* Team lead & contact count */}
        {(shift.team_lead || shift.contacts_count) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {shift.team_lead && (
              <div>
                <p className="text-muted-foreground">Team Lead</p>
                <p className="font-medium">{shift.team_lead}</p>
              </div>
            )}
            {shift.contacts_count > 0 && (
              <div>
                <p className="text-muted-foreground">Households to Canvas</p>
                <p className="font-medium">{shift.contacts_count}</p>
              </div>
            )}
          </div>
        )}

        {/* Materials */}
        {shift.materials_needed?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bring:</p>
            <div className="flex flex-wrap gap-1">
              {shift.materials_needed.map(material => (
                <Badge key={material} variant="outline" className="text-xs">
                  {material}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Capacity */}
        <div className="bg-muted/30 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">{signupCount} / {shift.capacity} volunteers</span>
            </div>
            {capacityFull && (
              <Badge variant="destructive" className="text-xs">Full</Badge>
            )}
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${capacityFull ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min((signupCount / shift.capacity) * 100, 100)}%` }}
            />
          </div>
          {spotsLeft > 0 && !capacityFull && (
            <p className="text-xs text-muted-foreground mt-1">{spotsLeft} spots available</p>
          )}
        </div>

        {/* Action buttons */}
        {shift.status === 'scheduled' && (
          <div className="flex gap-2">
            {isSignedUp ? (
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={onCancel}
              >
                Cancel Signup
              </Button>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={onSignUp}
                disabled={capacityFull}
              >
                {capacityFull ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Shift Full
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Sign Up for Shift
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}