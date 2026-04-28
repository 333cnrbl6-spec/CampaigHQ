import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Check, X, AlertCircle, WifiOff, Wifi, RefreshCw, CloudUpload } from 'lucide-react';
import { useOfflineFieldMode } from '../hooks/useOfflineFieldMode';

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
  const [interactionData, setInteractionData] = useState({ type: 'door_knock', outcome: 'neutral', notes: '' });
  const [supportLevel, setSupportLevel] = useState('unknown');

  const {
    isOnline,
    contacts,
    isLoadingContacts,
    queue,
    isSyncing,
    syncResult,
    logInteraction,
    syncQueue,
  } = useOfflineFieldMode();

  if (isLoadingContacts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-muted-foreground">No contacts to canvass</p>
            {!isOnline && <p className="text-xs text-muted-foreground mt-1">You're offline — connect to load contacts.</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentContact = contacts[currentIndex];
  const progress = Math.round((currentIndex / contacts.length) * 100);

  const handleLogInteraction = async () => {
    const interactionPayload = {
      contact_id: currentContact.id,
      type: interactionData.type,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      notes: interactionData.notes,
      outcome: interactionData.outcome,
    };

    const contactUpdatePayload = supportLevel !== 'unknown' ? {
      id: currentContact.id,
      data: { support_level: supportLevel, canvassed: true, canvass_date: new Date().toISOString().split('T')[0] }
    } : null;

    await logInteraction(interactionPayload, contactUpdatePayload);

    setShowInteractionDialog(false);
    setInteractionData({ type: 'door_knock', outcome: 'neutral', notes: '' });
    setSupportLevel('unknown');
    setCurrentIndex(i => Math.min(i + 1, contacts.length - 1));
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">

        {/* Online/Offline status bar */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? 'Online' : 'Offline — interactions will sync when reconnected'}
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">{queue.length} pending</span>
              {isOnline && (
                <button onClick={syncQueue} disabled={isSyncing} className="flex items-center gap-1 text-xs underline">
                  {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                  {isSyncing ? 'Syncing…' : 'Sync now'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sync result toast */}
        {syncResult && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            Synced {syncResult.synced} record{syncResult.synced !== 1 ? 's' : ''}
            {syncResult.failed > 0 && ` · ${syncResult.failed} failed`}
          </div>
        )}

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold font-heading">Door Knocking</h1>
            <span className="text-sm font-medium text-muted-foreground">{currentIndex + 1} of {contacts.length}</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
        </div>

        {/* Contact Card */}
        <Card>
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
            {currentContact.support_level && currentContact.support_level !== 'unknown' && (
              <div>
                <p className="text-sm text-muted-foreground">Previous Support</p>
                <Badge className={SUPPORT_LEVELS[currentContact.support_level]?.color}>
                  {SUPPORT_LEVELS[currentContact.support_level]?.label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full h-12 text-base gap-2" onClick={() => setShowInteractionDialog(true)}>
            <Check className="w-5 h-5" /> Log Interaction
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setCurrentIndex(i => Math.min(contacts.length - 1, i + 1))} disabled={currentIndex === contacts.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" className="w-full text-destructive" onClick={() => setCurrentIndex(i => Math.min(contacts.length - 1, i + 1))}>
            <X className="w-4 h-4 mr-2" /> Skip Contact
          </Button>
        </div>

        {/* Interaction Dialog */}
        <Dialog open={showInteractionDialog} onOpenChange={setShowInteractionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Interaction — {currentContact.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Support Level</label>
                <Select value={supportLevel} onValueChange={setSupportLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={interactionData.outcome} onValueChange={val => setInteractionData({ ...interactionData, outcome: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  value={interactionData.notes}
                  onChange={e => setInteractionData({ ...interactionData, notes: e.target.value })}
                  className="min-h-24"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowInteractionDialog(false)}>Cancel</Button>
                <Button onClick={handleLogInteraction}>
                  {isOnline ? 'Save & Next' : 'Save Offline & Next'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}