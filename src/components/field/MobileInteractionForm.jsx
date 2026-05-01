import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X } from 'lucide-react';

export default function MobileInteractionForm({ contact, onSubmit, isOnline, isLoading = false }) {
  const [supportLevel, setSupportLevel] = useState('unknown');
  const [outcome, setOutcome] = useState('neutral');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onSubmit({
      type: 'door_knock',
      outcome,
      notes,
      support_level: supportLevel,
    });
    // Reset form
    setSupportLevel('unknown');
    setOutcome('neutral');
    setNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Support Level - Large buttons for mobile */}
      <div>
        <label className="text-sm font-medium block mb-2">What's their support level?</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'strong_supporter', label: '✓ Strong' },
            { value: 'leaning', label: '~ Leaning' },
            { value: 'undecided', label: '? Undecided' },
            { value: 'opposed', label: '✗ Opposed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSupportLevel(value)}
              className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                supportLevel === value
                  ? 'ring-2 ring-primary bg-primary/10'
                  : 'bg-secondary/40 hover:bg-secondary/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Outcome */}
      <div>
        <label className="text-sm font-medium block mb-2">How did it go?</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'positive', label: '👍 Positive' },
            { value: 'neutral', label: '➜ Neutral' },
            { value: 'negative', label: '👎 Negative' },
            { value: 'no_answer', label: '🚪 No Answer' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setOutcome(value)}
              className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                outcome === value
                  ? 'ring-2 ring-primary bg-primary/10'
                  : 'bg-secondary/40 hover:bg-secondary/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium block mb-2">Quick notes (optional)</label>
        <Textarea
          placeholder="What was discussed? Key concerns?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-20 text-base"
        />
      </div>

      {/* Status indicator */}
      <div className={`text-xs px-3 py-2 rounded-lg ${
        isOnline
          ? 'bg-green-50 text-green-700'
          : 'bg-amber-50 text-amber-700'
      }`}>
        {isOnline ? '✓ Online — will save immediately' : '📱 Offline — will sync when connected'}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 h-12 text-base gap-2"
        >
          <Check className="w-5 h-5" />
          {isLoading ? 'Saving...' : 'Save & Next'}
        </Button>
      </div>
    </div>
  );
}