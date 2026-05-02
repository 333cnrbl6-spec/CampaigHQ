import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DataFetchError({ error, onRetry, title = 'Unable to Load Data' }) {
  if (!error) return null;

  const is403 = error.message?.includes('do not have access');
  
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 flex flex-col gap-4">
      <div className="flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {is403 
              ? 'You do not have permission to view this data.'
              : error.message || 'Something went wrong. Please try again.'}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={onRetry}
          className="gap-2 w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}