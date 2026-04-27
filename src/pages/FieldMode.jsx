import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Check, X, AlertCircle } from 'lucide-react';

const SUPPORT_LEVELS = {
  strong_supporter: { label: 'Strong Supporter', color: 'bg-green-100 text-green-800' },
  leaning: { label: 'Leaning', color: 'bg-blue-100 text-blue-800' },
  undecided: { label: 'Undecided', color: 'bg-yellow-100 text-yellow-800' },
  opposed: { label: 'Opposed', color: 'bg-red-100 text-red-800' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
};

export default function FieldMode() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [interactionData, setInteractionData] = useState({ type: 'door_knock', outcome: 'neutral' });
  const [supportLevel, setSupportLevel] = useState('unknown');

  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const createInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      setShowInteractionDialog(false);
      setInteractionData({ type: 'door_knock', outcome: 'neutral' });
      setSupportLevel('unknown');
      setCurrentIndex(Math.min(currentIndex + 1, contacts.length - 1));
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-muted-foreground">No contacts to canvass</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentContact = contacts[currentIndex];
  const progress = Math.round((currentIndex / contacts.length) * 100);

  const handleLogInteraction = () => {
    if (currentContact && interactionData.notes) {
      createInteractionMutation.mutate({
        contact_id: currentContact.id,
        type: interactionData.type,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        notes: interactionData.notes,
        outcome: interactionData.outcome,
      });

      if (supportLevel !== 'unknown') {
        updateContactMutation.mutate({
          id: currentContact.id,
          data: { support_level: supportLevel, canvassed: true, canvass_date: new Date().toISOString().split('T')[0] }
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold font-heading">Door Knocking</h1>
            <span className="text-sm font-medium text-muted-foreground">{currentIndex + 1} of {contacts.length}</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
        </div>

        {/* Contact Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{currentContact.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{currentContact.address}</p>
              {currentContact.postcode && <p className="text-sm">{currentContact.postcode}</p>}
            </div>

            {currentContact.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{currentContact.phone}</p>
              </div>
            )}

            {currentContact.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm bg-secondary/30 p-2 rounded">{currentContact.notes}</p>
              </div>
            )}

            {currentContact.support_level !== 'unknown' && (
              <div>
                <p className="text-sm text-muted-foreground">Previous Support</p>
                <Badge className={SUPPORT_LEVELS[currentContact.support_level].color}>
                  {SUPPORT_LEVELS[currentContact.support_level].label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={() => setShowInteractionDialog(true)}
          >
            <Check className="w-5 h-5" /> Log Interaction
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentIndex(Math.min(contacts.length - 1, currentIndex + 1))}
              disabled={currentIndex === contacts.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" className="w-full text-destructive">
            <X className="w-4 h-4 mr-2" /> Skip Contact
          </Button>
        </div>

        {/* Interaction Dialog */}
        <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Interaction - {currentContact.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Support Level</label>
                <Select value={supportLevel} onValueChange={setSupportLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong_supporter">Strong Supporter</SelectItem>
                    <SelectItem value="leaning">Leaning</SelectItem>
                    <SelectItem value="undecided">Undecided</SelectItem>
                    <SelectItem value="opposed">Opposed</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Outcome</label>
                <Select value={interactionData.outcome} onValueChange={(val) => setInteractionData({...interactionData, outcome: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Key Points</label>
                <Textarea
                  placeholder="What was discussed? Any key concerns or promises?"
                  value={interactionData.notes || ''}
                  onChange={(e) => setInteractionData({...interactionData, notes: e.target.value})}
                  className="min-h-24"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowInteractionDialog(false)}>Cancel</Button>
                <Button onClick={handleLogInteraction}>Save & Next</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}