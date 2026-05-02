import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCampaign } from '@/lib/CampaignContext';
import useSecureData from '@/hooks/useSecureData';
import DataFetchError from '@/components/DataFetchError';

const INTERACTION_TYPES = {
  phone_call: { icon: Phone, label: 'Phone Call', color: 'bg-blue-100 text-blue-800' },
  email: { icon: Mail, label: 'Email', color: 'bg-purple-100 text-purple-800' },
  door_knock: { icon: MapPin, label: 'Door Knock', color: 'bg-green-100 text-green-800' },
  text: { icon: MessageSquare, label: 'Text/SMS', color: 'bg-gray-100 text-gray-800' },
  meeting: { icon: MessageSquare, label: 'Meeting', color: 'bg-orange-100 text-orange-800' },
  other: { icon: MessageSquare, label: 'Other', color: 'bg-slate-100 text-slate-800' }
};

const OUTCOME_COLORS = {
  positive: 'bg-green-100 text-green-800',
  neutral: 'bg-gray-100 text-gray-800',
  negative: 'bg-red-100 text-red-800',
  no_answer: 'bg-yellow-100 text-yellow-800'
};

export default function ContactHistory() {
  const { campaignId } = useCampaign();
  const [selectedContact, setSelectedContact] = useState(null);
  const [showNewInteraction, setShowNewInteraction] = useState(false);
  const [formData, setFormData] = useState({ type: 'door_knock', outcome: 'neutral' });

  const queryClient = useQueryClient();

  // Fetch RLS-protected contacts and interactions
  const { data: contacts = [], error: contactError, refetch: refetchContacts } = useSecureData(
    'getContactDetails',
    { campaign_id: campaignId },
    { staleTime: 120000, refetchInterval: 120000 }
  );

  const { data: interactions = [], error: interactionError, refetch: refetchInteractions } = useSecureData(
    'getContactInteractions',
    { campaign_id: campaignId },
    { staleTime: 60000, refetchInterval: 60000 }
  );

  const createInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      setFormData({ type: 'door_knock', outcome: 'neutral' });
      setShowNewInteraction(false);
    },
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactInteraction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });

  const contactInteractions = selectedContact
    ? interactions.filter(i => i.contact_id === selectedContact.id).sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  const handleAddInteraction = () => {
    if (selectedContact && formData.type) {
      createInteractionMutation.mutate({
        contact_id: selectedContact.id,
        type: formData.type,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        notes: formData.notes,
        outcome: formData.outcome,
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-foreground">Contact History</h1>
      </div>

      {(contactError || interactionError) && (
        <DataFetchError 
          error={contactError || interactionError} 
          onRetry={() => {
            refetchContacts();
            refetchInteractions();
          }}
          title="Unable to Load Contact Data" 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedContact?.id === contact.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="font-semibold text-sm">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">{contact.postcode}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Interaction Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedContact ? (
            <>
              <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle>{selectedContact.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedContact.address}</p>
                  </div>
                  <Dialog open={showNewInteraction} onOpenChange={setShowNewInteraction}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Log Interaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Log Interaction - {selectedContact.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(INTERACTION_TYPES).map(([key, val]) => (
                                <SelectItem key={key} value={key}>{val.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Outcome</label>
                          <Select value={formData.outcome} onValueChange={(val) => setFormData({...formData, outcome: val})}>
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
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            placeholder="What happened during this interaction?"
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            className="min-h-24"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowNewInteraction(false)}>Cancel</Button>
                          <Button onClick={handleAddInteraction}>Log Interaction</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Interaction Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {contactInteractions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No interactions logged yet</p>
                  ) : (
                    contactInteractions.map((interaction) => {
                      const TypeIcon = INTERACTION_TYPES[interaction.type]?.icon || MessageSquare;
                      return (
                        <div key={interaction.id} className="border-l-4 border-primary pl-3 py-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-start gap-2">
                              <TypeIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="flex gap-2 items-center">
                                  <span className="font-medium text-sm">{INTERACTION_TYPES[interaction.type]?.label}</span>
                                  <Badge className={OUTCOME_COLORS[interaction.outcome]}>{interaction.outcome}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(interaction.date), 'MMM d, yyyy')}{interaction.time ? ` at ${interaction.time}` : ''}
                                </p>
                                <p className="text-sm mt-1">{interaction.notes}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteInteractionMutation.mutate(interaction.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              Select a contact to view or log interactions
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}