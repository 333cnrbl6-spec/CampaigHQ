import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Clock, Mail, MessageSquare } from 'lucide-react';

export default function SequencePreview({ sequence, onClose }) {
  const triggerLabels = {
    support_level_changed: 'Support Level Change',
    contact_created: 'New Contact Added',
    canvassed_status_changed: 'Canvassing Status',
    volunteer_status_changed: 'Volunteer Status',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{sequence.name}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Info */}
          <div className="space-y-3">
            {sequence.description && (
              <p className="text-sm text-muted-foreground">{sequence.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant={sequence.status === 'active' ? 'default' : 'secondary'}>
                {sequence.status}
              </Badge>
              <Badge variant="outline" className="capitalize gap-1">
                {sequence.channel === 'email' ? (
                  <>
                    <Mail className="w-3 h-3" />
                    Email
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3" />
                    SMS
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Trigger */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">When this happens:</p>
            <p className="text-sm text-blue-800">
              {triggerLabels[sequence.trigger_event]}
              {sequence.trigger_value && ` • ${sequence.trigger_value}`}
            </p>
          </div>

          {/* Messages timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Message Timeline</h3>

            {sequence.messages && sequence.messages.length > 0 ? (
              <div className="space-y-3">
                {sequence.messages.map((msg, idx) => (
                  <div key={idx} className="border-l-4 border-primary pl-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">Message {idx + 1}</span>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.delay_hours === 0 ? 'Immediate' : `${msg.delay_hours}h delay`}
                      </Badge>
                    </div>

                    {msg.subject && (
                      <div className="mb-2 p-2 bg-muted rounded text-sm">
                        <p className="text-xs text-muted-foreground font-medium">Subject:</p>
                        <p className="text-sm font-medium">{msg.subject}</p>
                      </div>
                    )}

                    <div className="p-3 bg-muted/50 rounded text-sm whitespace-pre-wrap font-mono">
                      {msg.body}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Available variables: {'{'}contact_name{'}'}, {'{'}volunteer_name{'}'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No messages configured</p>
            )}
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}