import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, X, Plus } from 'lucide-react';

export default function BulkAssignDialog({ open, onClose, turfs, onAssign }) {
  const [selectedTurfs, setSelectedTurfs] = useState([]);
  const [teamInput, setTeamInput] = useState('');
  const [team, setTeam] = useState([]);

  const toggleTurf = (id) => {
    setSelectedTurfs(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const addMember = () => {
    const val = teamInput.trim();
    if (val && !team.includes(val)) setTeam(prev => [...prev, val]);
    setTeamInput('');
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedTurfs([]);
      setTeam([]);
      setTeamInput('');
    }
  }, [open]);

  const handleAssign = () => {
    if (selectedTurfs.length === 0 || team.length === 0) return;
    onAssign(selectedTurfs, team);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Users className="w-5 h-5 text-primary" /> Bulk Assign Turfs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Turf selector */}
          <div>
            <p className="text-sm font-medium mb-2">Select Turfs ({selectedTurfs.length} selected)</p>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
              {turfs.map(turf => (
                <label key={turf.id} className="flex items-center gap-2.5 p-1.5 rounded hover:bg-muted cursor-pointer">
                  <Checkbox
                    checked={selectedTurfs.includes(turf.id)}
                    onCheckedChange={() => toggleTurf(turf.id)}
                  />
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: turf.color || '#16a34a' }} />
                  <span className="text-sm flex-1">{turf.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{turf.status}</Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Team builder */}
          <div>
            <p className="text-sm font-medium mb-2">Team / Volunteers</p>
            <div className="flex gap-2">
              <Input
                placeholder="Name or email..."
                value={teamInput}
                onChange={e => setTeamInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMember()}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={addMember} className="flex-shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {team.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {team.map(member => (
                  <Badge key={member} variant="secondary" className="gap-1 pr-1">
                    {member}
                    <button onClick={() => setTeam(prev => prev.filter(m => m !== member))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={handleAssign} disabled={selectedTurfs.length === 0 || team.length === 0}>
              Assign {selectedTurfs.length > 0 ? `${selectedTurfs.length} Turf${selectedTurfs.length > 1 ? 's' : ''}` : 'Turfs'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}