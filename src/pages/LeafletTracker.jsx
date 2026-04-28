import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Clock, Loader2, MapPin, User, Home } from 'lucide-react';
import LeafletRunForm from '../components/leaflet/LeafletRunForm';

const statusConfig = {
  not_started: { label: 'Not Started', color: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

export default function LeafletTracker() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterArea, setFilterArea] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['leaflet-runs'],
    queryFn: () => base44.entities.LeafletRun.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeafletRun.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leaflet-runs'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeafletRun.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leaflet-runs'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeafletRun.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaflet-runs'] }),
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const quickStatus = (run, status) => {
    const update = { status };
    if (status === 'completed') update.completed_date = new Date().toISOString().split('T')[0];
    updateMutation.mutate({ id: run.id, data: { ...run, ...update } });
  };

  const filtered = runs.filter(r => {
    const areaMatch = filterArea === 'all' || r.area === filterArea;
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    return areaMatch && statusMatch;
  });

  const total = runs.length;
  const completed = runs.filter(r => r.status === 'completed').length;
  const inProgress = runs.filter(r => r.status === 'in_progress').length;
  const totalLeaflets = runs.reduce((sum, r) => sum + (r.leaflets_delivered || 0), 0);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Leaflet Distribution Tracker</h1>
          <p className="text-muted-foreground mt-1">Track leafleting progress across Tyldesley & Mosley Common</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Street
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Streets Total</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{inProgress}</p>
          <p className="text-xs text-muted-foreground mt-1">In Progress</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalLeaflets.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Leaflets Delivered</p>
        </div>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-card border border-border/50 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{completed}/{total} streets completed ({pct}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <LeafletRunForm
            run={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            <SelectItem value="Tyldesley">Tyldesley</SelectItem>
            <SelectItem value="Mosley Common">Mosley Common</SelectItem>
            <SelectItem value="Astley">Astley</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Street List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No streets added yet. Add your first street to get started!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((run) => {
            const sc = statusConfig[run.status] || statusConfig.not_started;
            const StatusIcon = sc.icon;
            const progress = run.total_houses > 0 ? Math.round((run.leaflets_delivered / run.total_houses) * 100) : null;
            return (
              <div key={run.id} className="bg-card border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{run.street_name}</p>
                    <Badge variant="secondary" className="text-xs">{run.area}</Badge>
                    {run.postcode && <span className="text-xs text-muted-foreground">{run.postcode}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    {run.assigned_to && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{run.assigned_to}</span>
                    )}
                    {run.total_houses > 0 && (
                      <span className="flex items-center gap-1"><Home className="w-3 h-3" />{run.leaflets_delivered || 0}/{run.total_houses} houses</span>
                    )}
                    {progress !== null && <span className="text-primary font-medium">{progress}%</span>}
                    {run.notes && <span className="italic truncate max-w-[200px]">{run.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`text-xs gap-1 ${sc.color} border-0`}>
                    <StatusIcon className="w-3 h-3" />
                    {sc.label}
                  </Badge>
                  {run.status !== 'in_progress' && run.status !== 'completed' && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => quickStatus(run, 'in_progress')}>
                      Start
                    </Button>
                  )}
                  {run.status !== 'completed' && (
                    <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => quickStatus(run, 'completed')}>
                      Done ✓
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setEditing(run); setShowForm(true); }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => deleteMutation.mutate(run.id)}>
                    ✕
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}