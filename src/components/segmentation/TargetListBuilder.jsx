import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Users } from 'lucide-react';

export default function TargetListBuilder({ targetList, contacts, interactions, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(targetList?.name || '');
  const [description, setDescription] = useState(targetList?.description || '');
  const [segmentType, setSegmentType] = useState(targetList?.segment_type || 'support_level');

  // Filter state
  const [supportLevels, setSupportLevels] = useState(
    targetList?.filters?.support_levels || ['strong_supporter', 'leaning']
  );
  const [registeredOnly, setRegisteredOnly] = useState(
    targetList?.filters?.registered_voter === undefined ? false : targetList.filters.registered_voter
  );
  const [selectedTurfs, setSelectedTurfs] = useState(targetList?.filters?.turfs || []);
  const [minInteractions, setMinInteractions] = useState(targetList?.filters?.min_interactions || 0);

  // Get unique turfs from contacts
  const availableTurfs = useMemo(() => {
    const turfs = new Set();
    contacts.forEach(c => {
      (c.tags || []).forEach(tag => turfs.add(tag));
    });
    return Array.from(turfs).sort();
  }, [contacts]);

  // Calculate filtered contacts count
  const filteredContacts = useMemo(() => {
    const interactionMap = {};
    interactions.forEach(i => {
      if (!interactionMap[i.contact_id]) {
        interactionMap[i.contact_id] = 0;
      }
      interactionMap[i.contact_id]++;
    });

    return contacts.filter(c => {
      // Support level filter
      if (!supportLevels.includes(c.support_level || 'unknown')) return false;

      // Registered voter filter
      if (registeredOnly && !c.registered_voter) return false;

      // Turf filter
      if (selectedTurfs.length > 0) {
        const contactTurfs = c.tags || [];
        if (!selectedTurfs.some(t => contactTurfs.includes(t))) return false;
      }

      // Interaction filter
      if (minInteractions > 0 && (interactionMap[c.id] || 0) < minInteractions) return false;

      return true;
    });
  }, [contacts, interactions, supportLevels, registeredOnly, selectedTurfs, minInteractions]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a target list name');
      return;
    }

    const contactIds = filteredContacts.map(c => c.id);

    onSave({
      name,
      description,
      campaign_id: targetList?.campaign_id || '',
      segment_type: segmentType,
      filters: {
        support_levels: supportLevels,
        registered_voter: registeredOnly,
        turfs: selectedTurfs,
        min_interactions: minInteractions,
      },
      contact_ids: contactIds,
      contact_count: contactIds.length,
      is_active: true,
    });
  };

  const supportLevelOptions = [
    { value: 'strong_supporter', label: 'Strong Supporters' },
    { value: 'leaning', label: 'Leaning' },
    { value: 'undecided', label: 'Undecided' },
    { value: 'opposed', label: 'Opposed' },
    { value: 'unknown', label: 'Unknown' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{targetList ? 'Edit Target List' : 'Create Target List'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">List Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Undecided Voters in East Tyldesley"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this list for?"
                className="mt-1 h-20"
              />
            </div>
          </div>

          {/* Segment type */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <label className="text-sm font-medium">Segment Type</label>
            <select
              value={segmentType}
              onChange={(e) => setSegmentType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="support_level">By Support Level</option>
              <option value="demographic">By Demographics</option>
              <option value="interaction_history">By Interaction History</option>
              <option value="custom">Custom Filters</option>
            </select>
          </div>

          {/* Filters */}
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-sm">Filtering Criteria</h3>

            {/* Support levels */}
            <div>
              <label className="text-xs font-medium text-blue-900 mb-2 block">Support Levels</label>
              <div className="space-y-2">
                {supportLevelOptions.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={supportLevels.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSupportLevels([...supportLevels, opt.value]);
                        } else {
                          setSupportLevels(supportLevels.filter(l => l !== opt.value));
                        }
                      }}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Registered voters */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={registeredOnly}
                onCheckedChange={setRegisteredOnly}
              />
              <span className="text-sm">Registered voters only</span>
            </label>

            {/* Turfs */}
            {availableTurfs.length > 0 && (
              <div>
                <label className="text-xs font-medium text-blue-900 mb-2 block">Turfs (optional)</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableTurfs.map((turf) => (
                    <label key={turf} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedTurfs.includes(turf)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTurfs([...selectedTurfs, turf]);
                          } else {
                            setSelectedTurfs(selectedTurfs.filter(t => t !== turf));
                          }
                        }}
                      />
                      <span className="text-sm">{turf}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Min interactions */}
            <div>
              <label className="text-xs font-medium text-blue-900 mb-2 block">
                Minimum Interactions (0 = any)
              </label>
              <Input
                type="number"
                min="0"
                value={minInteractions}
                onChange={(e) => setMinInteractions(parseInt(e.target.value) || 0)}
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Preview count */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Contacts matching criteria:</span>
              </div>
              <div className="text-2xl font-bold text-primary">{filteredContacts.length}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || filteredContacts.length === 0} className="flex-1">
              {isSaving ? 'Saving...' : `Save Target List (${filteredContacts.length} contacts)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}