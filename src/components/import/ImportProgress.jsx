import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const stages = [
  {
    id: 1,
    name: 'Upload & Extract',
    hint: 'Uploading your file and reading its content…',
  },
  {
    id: 2,
    name: 'Analyse Structure',
    hint: 'AI is identifying columns, data types and record counts. Usually 20–40 s.',
  },
  {
    id: 3,
    name: 'Database Assessment',
    hint: 'Review field mapping and confirm which entity to import into.',
  },
  {
    id: 4,
    name: 'Confirm & Import',
    hint: 'Extracting every row, validating it, then writing to the database.',
  },
];

function StageTimer({ active }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!active || elapsed < 3) return null;
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-primary/70 mt-0.5">
      <Clock className="w-2.5 h-2.5" />
      {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
    </span>
  );
}

export default function ImportProgress({ currentStage, completedStages }) {
  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const isCompleted = completedStages.includes(stage.id);
        const isCurrent = currentStage === stage.id;
        const isPending = stage.id > currentStage;

        return (
          <div key={stage.id} className="flex items-start gap-3">
            {/* Circle indicator */}
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-0.5 transition-all',
                isCompleted && 'bg-green-100 text-green-700',
                isCurrent && 'bg-primary text-primary-foreground',
                isPending && 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                stage.id
              )}
            </div>

            {/* Label + hint */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium leading-tight transition-colors',
                  isCompleted && 'text-green-700',
                  isCurrent && 'text-primary',
                  isPending && 'text-muted-foreground'
                )}
              >
                {stage.name}
              </p>
              {isCurrent && (
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{stage.hint}</p>
              )}
              <StageTimer active={isCurrent} />
            </div>
          </div>
        );
      })}
    </div>
  );
}