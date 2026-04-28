import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, User, CheckCircle2, Clock, Play } from 'lucide-react';

const STATUS_STYLES = {
  unassigned: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function TurfSidebar({ turfs, selectedId, onSelect, onSave, onDelete, drawing }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (turf) => {
    setEditId(turf.id);
    setForm({ name: turf.name, assigned_to: turf.assigned_to || '', status: turf.status, color: turf.color || '#16a34a', notes: turf.notes || '' });
  };

  const handleSave = () => {
    onSave(editId, form);
    setEditId(null);
  };

  return (
    <div className="w-80 flex-shrink-0 h-full overflow-y-auto border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-heading font-bold text-lg">Turf Zones</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {drawing ? (
            <span className="text-primary font-medium animate-pulse">🖊 Drawing mode active — draw a shape on the map</span>
          ) : (
            `${turfs.length} zone${turfs.length !== 1 ? 's' : ''} defined`
          )}
        </p>
      </div>

      <div className="flex-1 divide-y">
        {turfs.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <p>No turf zones yet.</p>
            <p className="mt-1">Use the ✏️ Draw button on the map to create one.</p>
          </div>
        )}
        {turfs.map(turf => (
          <div
            key={turf.id}
            onClick={() => onSelect(turf.id)}
            className={`p-3 cursor-pointer hover:bg-muted/40 transition-colors ${selectedId === turf.id ? 'bg-muted/60 ring-1 ring-inset ring-primary/30' : ''}`}
          >
            {editId === turf.id ? (
              <div className="space-y-2" onClick={e => e.stopPropagation()}>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Zone name" className="text-sm h-8" />
                <Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} placeholder="Assigned to (name/email)" className="text-sm h-8" />
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="mt-1.5 ml-5">
                  <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[turf.status] || STATUS_STYLES.unassigned}`}>
                    {turf.status?.replace('_', ' ') || 'unassigned'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}