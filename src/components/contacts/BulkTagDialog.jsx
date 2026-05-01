import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';

const PRESET_TAGS = [
  'Requires Follow-up',
  'Display Poster',
  'Willing to Volunteer',
  'Needs Phone Call',
  'VIP Contact',
  'Data Issue',
];

const MODES = [
  { key: 'apply',   label: 'Add Tags',     icon: PlusCircle,  description: 'Add tags to selected contacts without removing existing ones.' },
  { key: 'remove',  label: 'Remove Tags',  icon: MinusCircle, description: 'Remove specific tags from selected contacts.' },
  { key: 'replace', label: 'Replace Tags', icon: RefreshCw,   description: 'Replace ALL existing tags on selected contacts with the chosen tags.' },
];

export default function BulkTagDialog({ isOpen, onOpenChange, selectedCount, onApply, loading }) {
  const [mode, setMode] = useState('apply');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');

  const handleToggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setCustomTag('');
    }
  };

  const handleClose = () => {
    setSelectedTags([]);
    setCustomTag('');
    setMode('apply');
    onOpenChange(false);
  };

  const handleApply = () => {
    onApply(selectedTags, mode);
    setSelectedTags([]);
    setCustomTag('');
    setMode('apply');
  };

  const actionLabel = {
    apply:   loading ? 'Adding…'    : `Add ${selectedTags.length} Tag${selectedTags.length !== 1 ? 's' : ''}`,
    remove:  loading ? 'Removing…'  : `Remove ${selectedTags.length} Tag${selectedTags.length !== 1 ? 's' : ''}`,
    replace: loading ? 'Replacing…' : `Replace Tags`,
  }[mode];

  const actionVariant = mode === 'remove' ? 'destructive' : 'default';
  const currentMode = MODES.find(m => m.key === mode);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Tag — {selectedCount} Contact{selectedCount !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setSelectedTags([]); }}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border text-xs font-medium transition-colors ${
                  mode === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted border-border hover:bg-muted/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Mode description */}
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            {currentMode.description}
            {mode === 'replace' && selectedTags.length === 0 && (
              <span className="block mt-1 text-amber-600 font-medium">Warning: replacing with no tags will clear all tags.</span>
            )}
          </p>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant={mode === 'remove' ? 'destructive' : 'default'}
                  className="gap-1"
                >
                  {tag}
                  <button onClick={() => handleToggleTag(tag)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Preset Tags */}
          <div>
            <p className="text-sm font-medium mb-2">Suggested Tags</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    selectedTags.includes(tag)
                      ? mode === 'remove'
                        ? 'bg-destructive text-destructive-foreground border-destructive'
                        : 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted border-border hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tag */}
          <div>
            <p className="text-sm font-medium mb-2">Custom Tag</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name…"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
              />
              <Button variant="outline" size="icon" onClick={handleAddCustomTag} disabled={!customTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={actionVariant}
              onClick={handleApply}
              disabled={(mode !== 'replace' && selectedTags.length === 0) || loading}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}