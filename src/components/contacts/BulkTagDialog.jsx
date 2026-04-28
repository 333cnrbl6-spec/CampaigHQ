import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

const PRESET_TAGS = [
  'Requires Follow-up',
  'Display Poster',
  'Willing to Volunteer',
  'Needs Phone Call',
  'VIP Contact',
  'Data Issue',
];

export default function BulkTagDialog({ isOpen, onOpenChange, selectedCount, onApply, loading }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');

  const handleToggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleApply = () => {
    onApply(selectedTags);
    setSelectedTags([]);
    setCustomTag('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Tags to {selectedCount} Contact{selectedCount !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge key={tag} variant="default" className="gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:opacity-70"
                  >
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
                      ? 'bg-primary text-primary-foreground border-primary'
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
            <p className="text-sm font-medium mb-2">Create Custom Tag</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddCustomTag}
                disabled={!customTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={selectedTags.length === 0 || loading}
            >
              {loading ? 'Applying...' : `Apply ${selectedTags.length} Tag${selectedTags.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}