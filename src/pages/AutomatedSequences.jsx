import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Zap, Pause, Play, Trash2, Eye, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import SequenceWizard from '@/components/outreach/SequenceWizard';

const TRIGGER_LABELS = {
  support_level_changed: 'Support level change',
  contact_created: 'New contact',
  canvassed_status_changed: 'Canvassed status',
  volunteer_status_changed: 'Volunteer status',
};

export default function AutomatedSequences() {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [settingUpAutomation, setSettingUpAutomation] = useState(null);
  const [newSequence, setNewSequence] = useState({
    name: '',
    description: '',
    trigger_event: 'support_level_changed',
    trigger_value: 'strong_supporter',
    channel: 'email',
    messages: [],
    filters: { support_level: [], has_contact_method: 'any' },
    status: 'active',
  });

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['outreach_sequences'],
    queryFn: () => base44.entities.OutreachSequence.list('-created_date', 100),
  });

  const { data: automations = [] } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      try {
        return await base44.asServiceRole.automations.list();
      } catch {
        return [];
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingSequence) {
        await base44.entities.OutreachSequence.update(editingSequence.id, data);
      } else {
        await base44.entities.OutreachSequence.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach_sequences'] });
      setShowBuilder(false);
      setEditingSequence(null);
      setNewSequence({
        name: '',
        description: '',
        trigger_event: 'support_level_changed',
        trigger_value: 'strong_supporter',
        channel: 'email',
        messages: [],
        filters: { support_level: [], has_contact_method: 'any' },
        status: 'active',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (seq) => {
      await base44.entities.OutreachSequence.update(seq.id, {
        status: seq.status === 'active' ? 'paused' : 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach_sequences'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.OutreachSequence.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach_sequences'] });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (sequence) => {
      // Create an entity automation that triggers when a Contact's support_level changes
      await base44.asServiceRole.automations.create({
        automation_type: 'entity',
        name: `Trigger: ${sequence.name}`,
        function_name: 'processOutreachSequences',
        entity_name: 'Contact',
        event_types: ['update'],
        trigger_conditions: {
          logic: 'and',
          conditions: [
            {
              field: 'changed_fields',
              operator: 'contains',
              value: 'support_level'
            },
            {
              field: 'data.support_level',
              operator: 'equals',
              value: sequence.trigger_value
            }
          ]
        },
        function_args: {
          event_type: sequence.trigger_event,
          trigger_value: sequence.trigger_value
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setSettingUpAutomation(null);
    },
  });

  const handleSaveSequence = async () => {
    if (!newSequence.name || newSequence.messages.length === 0) {
      alert('Please enter a name and add at least one message');
      return;
    }
    saveMutation.mutate(newSequence);
  };

  const getAutomationStatus = (sequence) => {
    return automations.some(a => a.name === `Trigger: ${sequence.name}` && !a.is_archived);
  };

  const totalSent = sequences.reduce((sum, s) => sum + (s.sent_count || 0), 0);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Automated Outreach Sequences</h1>
          <p className="text-muted-foreground">Create email/SMS sequences triggered by contact status changes</p>
        </div>
        <Button onClick={() => { setShowBuilder(true); setEditingSequence(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Sequence
        </Button>
      </div>

      {/* Info Banner */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          Sequences automatically trigger when contacts change support level. Enable "Set Up Automation" to activate each sequence.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sequences</p>
                <p className="text-3xl font-bold">{sequences.filter(s => s.status === 'active').length}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages Sent</p>
                <p className="text-3xl font-bold">{totalSent}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sequences</p>
                <p className="text-3xl font-bold">{sequences.length}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold">Your Sequences</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sequences.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-muted-foreground">No sequences yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          sequences.map(seq => {
            const hasAutomation = getAutomationStatus(seq);
            return (
              <Card key={seq.id} className={!hasAutomation ? 'opacity-75' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{seq.name}</h3>
                        <Badge variant={seq.status === 'active' ? 'default' : 'secondary'}>
                          {seq.status === 'active' ? 'Active' : 'Paused'}
                        </Badge>
                        {hasAutomation && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ✓ Automated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{seq.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{seq.channel === 'email' ? '📧 Email' : '💬 SMS'}</Badge>
                        <Badge variant="outline">{TRIGGER_LABELS[seq.trigger_event]}</Badge>
                        {seq.trigger_event === 'support_level_changed' && (
                          <Badge variant="outline">{seq.trigger_value.replace('_', ' ')}</Badge>
                        )}
                        <Badge variant="outline">{seq.messages.length} msg{seq.messages.length !== 1 ? 's' : ''}</Badge>
                        <Badge variant="outline">{seq.sent_count || 0} sent</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {seq.status === 'active' && !hasAutomation && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => setSettingUpAutomation(seq)}
                          disabled={createAutomationMutation.isPending}
                        >
                          {createAutomationMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Settings className="w-3 h-3" />
                          )}
                          Set Up Automation
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMutation.mutate(seq)}
                        disabled={toggleMutation.isPending}
                      >
                        {seq.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingSequence(seq); setNewSequence(seq); setShowBuilder(true); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Delete this sequence?')) {
                            deleteMutation.mutate(seq.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Message preview */}
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                    {seq.messages.slice(0, 2).map((msg, idx) => (
                      <div key={idx}>
                        <p className="text-xs text-muted-foreground">Message {idx + 1} ({msg.delay_hours}h delay)</p>
                        {msg.subject && <p className="font-medium text-xs">{msg.subject}</p>}
                        <p className="text-xs text-muted-foreground line-clamp-1">{msg.body}</p>
                      </div>
                    ))}
                    {seq.messages.length > 2 && <p className="text-xs text-muted-foreground">+{seq.messages.length - 2} more</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSequence ? 'Edit Sequence' : 'Create New Sequence'}</DialogTitle>
          </DialogHeader>
          <SequenceWizard sequence={newSequence} onChange={setNewSequence} />
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
            <Button onClick={handleSaveSequence} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Sequence
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Automation Setup Dialog */}
      {settingUpAutomation && (
        <Dialog open={!!settingUpAutomation} onOpenChange={() => setSettingUpAutomation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate Automation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will create a backend automation that triggers the "{settingUpAutomation.name}" sequence whenever a contact's support level changes to <strong>{settingUpAutomation.trigger_value.replace('_', ' ')}</strong>.
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The automation will run automatically in the background. You can disable it from the Automations section at any time.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSettingUpAutomation(null)}>Cancel</Button>
                <Button
                  onClick={() => createAutomationMutation.mutate(settingUpAutomation)}
                  disabled={createAutomationMutation.isPending}
                >
                  {createAutomationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Activate Automation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}