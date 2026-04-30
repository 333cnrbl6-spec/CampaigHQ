import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, User, Users, Target, AlertTriangle, Flame, ChevronDown, ChevronUp, Navigation, Mail, Layers } from 'lucide-react';

const STATUS_STYLES = {
  unassigned: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const PRIORITY_CONFIG = {
  normal: { label: 'Normal', icon: null, style: 'bg-slate-100 text-slate-600' },
  high: { label: 'High', icon: AlertTriangle, style: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', icon: Flame, style: 'bg-red-100 text-red-700' },
};

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

function ProgressBar({ knocked, target }) {
  if (!target || target === 0) return null;
  const pct = Math.min(100, Math.round((knocked / target) * 100));
  return (
    <div className="ml-5 mt-1.5">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>{knocked} / {target} doors</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#16a34a' : pct >= 60 ? '#f59e0b' : '#3b82f6' }}
        />
      </div>
    </div>
  );
}

export default function TurfSidebar({ turfs, selectedId, onSelect, onSave, onDelete, drawing, onBulkAssign }) {
  const navigate = useNavigate();
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const startEdit = (turf) => {
    setEditId(turf.id);
    setForm({
      name: turf.name,
      assigned_to: turf.assigned_to || '',
      status: turf.status || 'unassigned',
      color: turf.color || '#16a34a',
      notes: turf.notes || '',
      priority: turf.priority || 'normal',
      goal: turf.goal || '',
      target_doors: turf.target_doors || 0,
      doors_knocked: turf.doors_knocked || 0,
    });
  };

  const handleSave = () => {
    onSave(editId, { ...form, target_doors: Number(form.target_doors), doors_knocked: Number(form.doors_knocked) });
    setEditId(null);
  };

  const filtered = turfs
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });

  const urgentCount = turfs.filter(t => t.priority === 'urgent').length;
  const highCount = turfs.filter(t => t.priority === 'high').length;

  return (
    <div className="w-80 flex-shrink-0 h-full overflow-y-auto border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg">Turf Zones</h2>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowFilters(s => !s)}>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {drawing ? (
            <span className="text-primary font-medium animate-pulse">🖊 Drawing mode — draw a shape on the map</span>
          ) : (
            `${turfs.length} zones defined`
          )}
        </p>
        {(urgentCount > 0 || highCount > 0) && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {urgentCount > 0 && <Badge className="text-[10px] bg-red-100 text-red-700 gap-1"><Flame className="w-2.5 h-2.5" />{urgentCount} Urgent</Badge>}
            {highCount > 0 && <Badge className="text-[10px] bg-orange-100 text-orange-700 gap-1"><AlertTriangle className="w-2.5 h-2.5" />{highCount} High Priority</Badge>}
          </div>
        )}

        {showFilters && (
          <div className="mt-3 space-y-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Filter by priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {onBulkAssign && (
          <Button size="sm" variant="outline" className="w-full mt-3 gap-2 h-7 text-xs" onClick={onBulkAssign}>
            <Users className="w-3.5 h-3.5" /> Bulk Assign
          </Button>
        )}
      </div>

      {/* Quick Actions Panel — shown when a zone is selected */}
      {selectedId && (() => {
        const selected = turfs.find(t => t.id === selectedId);
        if (!selected) return null;
        return (
          <div className="p-3 border-b bg-primary/5 space-y-2">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
              <Layers className="w-3 h-3" /> Actions for: <span className="truncate">{selected.name}</span>
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-2 justify-start"
                onClick={() => navigate(`/route?turf_id=${selected.id}`)}
              >
                <Navigation className="w-3.5 h-3.5 text-primary" />
                Optimise Route for this Zone
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-2 justify-start"
                onClick={() => navigate(`/leaflets?turf_id=${selected.id}`)}
              >
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                View Leaflet Runs for this Zone
              </Button>
              {!selected.assigned_to && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-2 justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    const name = window.prompt('Assign volunteer (name or email):');
                    if (name?.trim()) onSave(selected.id, { ...selected, assigned_to: name.trim(), status: 'assigned' });
                  }}
                >
                  <User className="w-3.5 h-3.5" />
                  Assign Volunteer
                </Button>
              )}
              {selected.assigned_to && (
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-xs text-blue-700 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {selected.assigned_to}
                  </span>
                  <button
                    className="text-[10px] text-blue-400 hover:text-blue-700 underline"
                    onClick={() => {
                      const name = window.prompt('Reassign to (name or email):', selected.assigned_to);
                      if (name !== null) onSave(selected.id, { ...selected, assigned_to: name.trim(), status: name.trim() ? 'assigned' : 'unassigned' });
                    }}
                  >
                    Reassign
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="flex-1 divide-y">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <p>No turf zones match filters.</p>
          </div>
        )}
        {filtered.map(turf => {
          const priorityCfg = PRIORITY_CONFIG[turf.priority] || PRIORITY_CONFIG.normal;
          const PriorityIcon = priorityCfg.icon;
          return (
            <div
              key={turf.id}
              onClick={() => onSelect(turf.id)}
              className={`p-3 cursor-pointer hover:bg-muted/40 transition-colors ${selectedId === turf.id ? 'bg-muted/60 ring-1 ring-inset ring-primary/30' : ''}`}
            >
              {editId === turf.id ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Zone name" className="text-sm h-8" />
                  <Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} placeholder="Assigned to (name/email)" className="text-sm h-8" />

                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} placeholder="Goal (e.g. 'Leaflet drop only')" className="text-sm h-8" />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Target Doors</p>
                      <Input type="number" value={form.target_doors} onChange={e => setForm({ ...form, target_doors: e.target.value })} className="text-sm h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Doors Knocked</p>
                      <Input type="number" value={form.doors_knocked} onChange={e => setForm({ ...form, doors_knocked: e.target.value })} className="text-sm h-8" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Colour</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm({ ...form, color: c })}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="text-sm h-8" />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave}>Save</Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: turf.color || '#16a34a' }} />
                      <span className="font-medium text-sm truncate">{turf.name}</span>
                      {PriorityIcon && <PriorityIcon className={`w-3.5 h-3.5 flex-shrink-0 ${turf.priority === 'urgent' ? 'text-red-500' : 'text-orange-500'}`} />}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); startEdit(turf); }} className="p-1 hover:bg-muted rounded">
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDelete(turf.id); }} className="p-1 hover:bg-muted rounded">
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {turf.assigned_to && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 ml-5">
                      <User className="w-3 h-3" /> {turf.assigned_to}
                    </p>
                  )}
                  {turf.assigned_team?.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 ml-5">
                      <Users className="w-3 h-3" /> Team: {turf.assigned_team.slice(0, 2).join(', ')}{turf.assigned_team.length > 2 ? ` +${turf.assigned_team.length - 2}` : ''}
                    </p>
                  )}
                  {turf.goal && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 ml-5">
                      <Target className="w-3 h-3" /> {turf.goal}
                    </p>
                  )}

                  <div className="mt-1.5 ml-5 flex gap-1.5 flex-wrap">
                    <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[turf.status] || STATUS_STYLES.unassigned}`}>
                      {turf.status?.replace('_', ' ') || 'unassigned'}
                    </Badge>
                    {turf.priority && turf.priority !== 'normal' && (
                      <Badge className={`text-[10px] px-1.5 py-0 ${priorityCfg.style}`}>
                        {priorityCfg.label}
                      </Badge>
                    )}
                  </div>

                  <ProgressBar knocked={turf.doors_knocked || 0} target={turf.target_doors || 0} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}