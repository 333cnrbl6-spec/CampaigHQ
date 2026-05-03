import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataFetchError from '@/components/DataFetchError';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Leaf, TrendingUp, Pencil, Trash2, Upload } from 'lucide-react';
import SmartDataImporter from '@/components/import/SmartDataImporter';

const CATEGORIES = ['environment', 'housing', 'transport', 'community', 'health', 'education', 'economy', 'planning'];
const PRIORITIES = ['high', 'medium', 'low'];

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-muted text-muted-foreground border-border',
};

const categoryIcons = {
  environment: '🌿', housing: '🏠', transport: '🚲', community: '🤝',
  health: '💚', education: '📚', economy: '💰', planning: '📋',
};

const emptyIssue = { title: '', category: 'environment', description: '', policy_position: '', priority: 'medium', mentions_count: 0 };

export default function Issues() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyIssue);
  const queryClient = useQueryClient();
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;

  const { data: issues = [], error: issueError, isLoading, refetch } = useQuery({
    queryKey: ['issues', campaignId],
    queryFn: () => base44.entities.Issue.filter({ campaign_id: campaignId }, '-mentions_count'),
    enabled: !!campaignId,
    staleTime: 180000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['issues', campaignId] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Issue.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => { invalidate(); setDialogOpen(false); setForm(emptyIssue); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Issue.update(id, data),
    onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); setForm(emptyIssue); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Issue.delete(id),
    onSuccess: () => invalidate(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      {issueError && (
        <div className="mb-6">
          <DataFetchError error={issueError} onRetry={refetch} title="Unable to Load Issues" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Local Issues</h1>
          <p className="text-muted-foreground mt-1">Track the issues voters care about</p>
        </div>
        <div className="flex gap-2">
           <SmartDataImporter
             entityName="Issue"
             onComplete={() => invalidate()}
             trigger={{
               type: Button,
               props: { variant: 'outline', className: 'gap-2', children: [<Upload key="icon" className="w-4 h-4" />, 'Import Data'] }
             }}
           />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyIssue); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Issue</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">{editing ? 'Edit Issue' : 'New Issue'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What is this issue about?" />
              </div>
              <div className="space-y-2">
                <Label>Paul's Policy Position</Label>
                <Textarea value={form.policy_position} onChange={(e) => setForm({ ...form, policy_position: e.target.value })} rows={3} placeholder="Green Party / Paul's stance..." />
              </div>
              <div className="space-y-2">
                <Label>Times Mentioned by Voters</Label>
                <Input type="number" value={form.mentions_count} onChange={(e) => setForm({ ...form, mentions_count: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(emptyIssue); }}>Cancel</Button>
                <Button type="submit">{editing ? 'Update' : 'Add Issue'}</Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16">
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No issues tracked yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first issue to start tracking what voters care about.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{categoryIcons[issue.category] || '📋'}</span>
                  <div>
                    <h3 className="font-semibold">{issue.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="capitalize text-xs">{issue.category}</Badge>
                      <Badge variant="secondary" className={`text-xs border ${priorityColors[issue.priority]}`}>
                        {issue.priority} priority
                      </Badge>
                      {issue.mentions_count > 0 && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <TrendingUp className="w-3 h-3" /> {issue.mentions_count} mentions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(issue); setForm(issue); setDialogOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(issue.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {issue.description && <p className="text-sm text-muted-foreground mt-3">{issue.description}</p>}
              {issue.policy_position && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-1">Paul's Position</p>
                  <p className="text-sm">{issue.policy_position}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}