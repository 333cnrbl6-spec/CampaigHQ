import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExtractionPreview({ extractedText, fileName, onProceed }) {
  const [expanded, setExpanded] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <h3 className="font-semibold text-sm">Content extracted from {fileName}</h3>
        </button>
        <p className="text-xs text-muted-foreground mt-1">
          Review the text extracted from your document. We'll use this to detect the data type and create records.
        </p>
      </div>

      {expanded && (
        <div className="space-y-3">
          <div className="bg-white border border-amber-100 rounded-lg p-4 max-h-48 overflow-y-auto text-sm font-mono text-foreground/70 whitespace-pre-wrap break-words">
            {extractedText || '(No text extracted)'}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-sm text-foreground/70">
              The extraction looks correct, proceed with import
            </span>
          </label>

          <Button
            onClick={onProceed}
            disabled={!confirmed}
            className="w-full"
          >
            Proceed to Field Mapping
          </Button>
        </div>
      )}
    </div>
  );
}