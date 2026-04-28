import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Zap, Pause, Play, Trash2, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import SequenceBuilder from '@/components/outreach/SequenceBuilder';

const TRIGGER_LABELS = {
  support_level_changed: 'Support level change',
  contact_created: 'New contact',
  canvassed_status_changed: 'Canvassed status',
  volunteer_status_changed: 'Volunteer status',
};

export default function OutreachAutomation() {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
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

  const { data: sequences = [] } = useQuery({
    queryKey: ['outreach_sequences'],
    queryFn: () => base44.entities.OutreachSequence.list('-created_date', 100),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['outreach_logs'],
    queryFn: () => base44.entities.OutreachLog.list('-created_date', 50),
  });

  const handleSaveSequence = async () => {
    if (!newSequence.name || newSequence.messages.length === 0) {
      alert('Please enter a name and add at least one message');
      return;
    }

    try {
      if (editingSequence) {
        await base44.entities.OutreachSequence.update(editingSequence.id, newSequence);
      } else {
        await base44.entities.OutreachSequence.create(newSequence);
      }
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
    } catch (error) {
      alert('Error saving sequence: ' + error.message);
    }
  };

  const toggleSequence = async (seq) => {
    await base44.entities.OutreachSequence.update(seq.id, {
      status: seq.status === 'active' ? 'paused' : 'active',
    });
    queryClient.invalidateQueries({ queryKey: ['outreach_sequences'] });
  };

  const deleteSequence = async (id) => {
    if (confirm('Delete this sequence?')) {
      await base44.entities.OutreachSequence.delete(id);
      queryClient.invalidateQueries({ queryKey: ['outreach_sequences'] });
    }
  };

  const recentSent = logs.filter(l => l.status === 'sent').slice(0, 5);
  const totalSent = logs.filter(l => l.status === 'sent').length;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Automated Outreach Sequences</h1>
          <p className="text-muted-foreground">Trigger personalized email and SMS campaigns based on voter actions</p>
        </div>
        <Button onClick={() => { setShowBuilder(true); setEditingSequence(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
      <div className="space-y-4 mb-8">
        <h2 className="font-heading text-xl font-bold">Your Sequences</h2>
        {sequences.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-muted-foreground">No sequences yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          sequences.map(seq => (
            <Card key={seq.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{seq.name}</h3>
                      <Badge variant={seq.status === 'active' ? 'default' : 'secondary'}>
                        {seq.status === 'active' ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{seq.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{seq.channel === 'email' ? '📧 Email' : '💬 SMS'}</Badge>
                      <Badge variant="outline">{TRIGGER_LABELS[seq.trigger_event]}</Badge>
                      <Badge variant="outline">{seq.messages.length} message{seq.messages.length !== 1 ? 's' : ''}</Badge>
                      <Badge variant="outline">{seq.sent_count || 0} sent</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSequence(seq)}
                    >
                      {seq.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { setEditingSequence(seq); setNewSequence(seq); setShowBuilder(true); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteSequence(seq.id)}
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
                  {seq.messages.length > 2 && <p className="text-xs text-muted-foreground">+{seq.messages.length - 2} more messages</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Activity */}
      {recentSent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSent.map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{log.contact_name}</p>
                    <p className="text-xs text-muted-foreground">{log.contact_email}</p>
                  </div>
                  <Badge variant="outline">{log.channel === 'email' ? '📧' : '💬'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Builder Dialog */}
      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSequence ? 'Edit Sequence' : 'Create New Sequence'}</DialogTitle>
          </DialogHeader>
          <SequenceBuilder sequence={newSequence} onChange={setNewSequence} />
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
            <Button onClick={handleSaveSequence}>Save Sequence</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}