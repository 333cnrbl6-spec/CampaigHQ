import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const stages = [
  { id: 1, name: 'Upload & Extract', icon: 'file' },
  { id: 2, name: 'Analyze Structure', icon: 'grid' },
  { id: 3, name: 'Database Assessment', icon: 'database' },
  { id: 4, name: 'Confirm & Import', icon: 'check' },
];

export default function ImportProgress({ currentStage, completedStages }) {
  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const isCompleted = completedStages.includes(stage.id);
        const isCurrent = currentStage === stage.id;
        const isPending = stage.id > currentStage;

        return (
          <div key={stage.id} className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  isCompleted && 'bg-green-100 text-green-700',
                  isCurrent && 'bg-primary text-primary-foreground animate-pulse',
                  isPending && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  stage.id
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  isCompleted && 'text-green-700',
                  isCurrent && 'text-primary',
                  isPending && 'text-muted-foreground'
                )}
              >
                {stage.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}