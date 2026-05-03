import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Play, Pause, Eye } from 'lucide-react';
import SequenceBuilder from '@/components/outreach/SequenceBuilder';
import SequencePreview from '@/components/outreach/SequencePreview';

export default function OutreachSequenceManager() {
  const { campaign } = useCampaign();
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [previewSequence, setPreviewSequence] = useState(null);

  // Fetch sequences
  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['outreachSequences', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const all = await base44.entities.OutreachSequence.list('-created_date', 500);
      return Array.isArray(all) ? all : [];
    },
  });

  // Fetch logs for stats
  const { data: logs = [] } = useQuery({
    queryKey: ['outreachLogs', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const all = await base44.entities.OutreachLog.list('-sent_at', 1000);
      return Array.isArray(all) ? all : [];
    },
  });

  // Create/Update sequence
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingSequence?.id) {
        return base44.entities.OutreachSequence.update(editingSequence.id, data);
      }
      return base44.entities.OutreachSequence.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreachSequences'] });
      setShowBuilder(false);
      setEditingSequence(null);
    },
  });

  // Toggle sequence status
  const toggleMutation = useMutation({
    mutationFn: async (sequence) => {
      return base44.entities.OutreachSequence.update(sequence.id, {
        status: sequence.status === 'active' ? 'paused' : 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreachSequences'] });
    },
  });

  // Delete sequence
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.OutreachSequence.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreachSequences'] });
    },
  });

  // Get stats for sequence
  const getSequenceStats = (sequenceId) => {
    const sequenceLogs = logs.filter(l => l.sequence_id === sequenceId);
    return {
      total: sequenceLogs.length,
      sent: sequenceLogs.filter(l => l.status === 'sent').length,
      scheduled: sequenceLogs.filter(l => l.status === 'scheduled').length,
      failed: sequenceLogs.filter(l => l.status === 'failed').length,
    };
  };

  const triggerLabels = {
    support_level_changed: 'Support Level Change',
    contact_created: 'New Contact Added',
    canvassed_status_changed: 'Canvassing Status',
    volunteer_status_changed: 'Volunteer Status',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Outreach Sequences</h1>
            <p className="text-sm text-muted-foreground mt-1">Automated follow-up messages triggered by contact interactions</p>
          </div>
          <Button 
            onClick={() => {
              setEditingSequence(null);
              setShowBuilder(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Sequence
          </Button>
        </div>

        {/* Builder modal */}
        {showBuilder && (
          <SequenceBuilder 
            sequence={editingSequence}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => {
              setShowBuilder(false);
              setEditingSequence(null);
            }}
            isSaving={saveMutation.isPending}
          />
        )}

        {/* Preview modal */}
        {previewSequence && (
          <SequencePreview 
            sequence={previewSequence}
            onClose={() => setPreviewSequence(null)}
          />
        )}

        {/* Sequences list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : sequences.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 gap-4">
              <p className="text-muted-foreground">No sequences created yet</p>
              <Button onClick={() => setShowBuilder(true)}>Create your first sequence</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sequences.map((sequence) => {
              const stats = getSequenceStats(sequence.id);
              return (
                <Card key={sequence.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{sequence.name}</h3>
                          <Badge variant={sequence.status === 'active' ? 'default' : 'secondary'}>
                            {sequence.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {sequence.channel}
                          </Badge>
                          <Badge variant="outline">
                            {triggerLabels[sequence.trigger_event]}
                          </Badge>
                        </div>
                        {sequence.description && (
                          <p className="text-sm text-muted-foreground mb-3">{sequence.description}</p>
                        )}

                        {/* Stats */}
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{stats.sent}</span>
                            <span className="text-muted-foreground">sent</span>
                          </div>
                          {stats.scheduled > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-blue-600">{stats.scheduled}</span>
                              <span className="text-muted-foreground">scheduled</span>
                            </div>
                          )}
                          {stats.failed > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-red-600">{stats.failed}</span>
                              <span className="text-muted-foreground">failed</span>
                            </div>
                          )}
                        </div>

                        {/* Trigger details */}
                        <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                          <p className="text-muted-foreground">
                            <strong>Trigger:</strong> {triggerLabels[sequence.trigger_event]} 
                            {sequence.trigger_value && ` → ${sequence.trigger_value}`}
                          </p>
                          <p className="text-muted-foreground mt-1">
                            <strong>Messages:</strong> {sequence.messages?.length || 0} in sequence
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewSequence(sequence)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMutation.mutate(sequence)}
                          title={sequence.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {sequence.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSequence(sequence);
                            setShowBuilder(true);
                          }}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Delete this sequence?')) {
                              deleteMutation.mutate(sequence.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}