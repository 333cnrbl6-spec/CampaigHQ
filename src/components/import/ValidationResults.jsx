import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ValidationResults({ result, onConfirm, onCancel, loading }) {
  const [expandedErrors, setExpandedErrors] = useState({});

  const toggleError = (idx) => {
    setExpandedErrors(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const validPercentage = Math.round((result.valid / result.total) * 100);
  const hasErrors = result.invalid.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">Validation Results</h3>
            <p className="text-sm text-muted-foreground">
              {result.valid} of {result.total} records passed validation
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{validPercentage}%</div>
            <div className="text-xs text-muted-foreground">Valid Records</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${validPercentage}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Valid Records</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{result.valid}</div>
          </div>
          <div className={cn(
            'rounded-lg p-4 border',
            hasErrors ? 'bg-destructive/10 border-destructive/20' : 'bg-muted border-border'
          )}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className={cn(
                'w-4 h-4',
                hasErrors ? 'text-destructive' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-sm font-medium',
                hasErrors ? 'text-destructive' : 'text-muted-foreground'
              )}>
                Issues Found
              </span>
            </div>
            <div className={cn(
              'text-2xl font-bold',
              hasErrors ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {result.invalid.length}
            </div>
          </div>
        </div>

        {/* Error list */}
        {hasErrors && (
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-semibold text-foreground">Issues to Review</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.invalid.map((validation, idx) => (
                <div
                  key={idx}
                  className="bg-destructive/5 border border-destructive/20 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleError(idx)}
                    className="w-full flex items-start justify-between p-3 hover:bg-destructive/10 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">
                        Record #{validation.recordIndex}
                      </p>
                      <p className="text-xs text-destructive/70 mt-1">
                        {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-destructive flex-shrink-0 transition-transform',
                        expandedErrors[idx] && 'rotate-180'
                      )}
                    />
                  </button>
                  
                  {expandedErrors[idx] && (
                    <div className="bg-destructive/10 border-t border-destructive/20 p-3 space-y-2">
                      {validation.errors.map((error, errorIdx) => (
                        <div key={errorIdx} className="flex gap-2 text-xs">
                          <span className="text-destructive font-semibold flex-shrink-0">•</span>
                          <span className="text-destructive/80">{error}</span>
                        </div>
                      ))}
                      
                      {validation.record && (
                        <div className="mt-3 pt-3 border-t border-destructive/20">
                          <p className="text-xs font-medium text-destructive mb-1">Record data:</p>
                          <pre className="text-xs bg-white/50 rounded p-2 overflow-x-auto text-destructive/70">
                            {JSON.stringify(validation.record, null, 2).substring(0, 200)}...
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {result.valid > 0 && (
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Importing...' : `Import ${result.valid} Valid Record${result.valid !== 1 ? 's' : ''}`}
            </Button>
          )}
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
            className={result.valid > 0 ? '' : 'w-full'}
          >
            Go Back
          </Button>
        </div>
      </div>

      {/* Info message */}
      {result.invalid.length > 0 && result.valid === 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            <strong>No valid records found.</strong> Fix the issues above and try again, or upload a different file.
          </p>
        </div>
      )}

      {result.invalid.length > 0 && result.valid > 0 && (
        <div className="bg-accent/10 border border-accent rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            <strong>Note:</strong> {result.invalid.length} record{result.invalid.length !== 1 ? 's' : ''} with validation errors will be skipped. Only valid records will be imported.
          </p>
        </div>
      )}
    </div>
  );
}