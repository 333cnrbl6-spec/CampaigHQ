import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function RecentImports() {
  const queryClient = useQueryClient();
  const [rollbackLoading, setRollbackLoading] = useState(null);

  const { data: imports, isLoading } = useQuery({
    queryKey: ['import_logs'],
    queryFn: () => base44.entities.ImportLog.list('-created_date', 20),
    initialData: [],
  });

  const rollbackMutation = useMutation({
    mutationFn: async (importLog) => {
      setRollbackLoading(importLog.id);
      try {
        // Delete all created records
        if (importLog.created_record_ids?.length > 0) {
          for (const recordId of importLog.created_record_ids) {
            await base44.entities[importLog.entity_type].delete(recordId);
          }
        }
        // Delete the import log
        await base44.entities.ImportLog.delete(importLog.id);
        // Refresh the entity data
        queryClient.invalidateQueries({ queryKey: [importLog.entity_type.toLowerCase()] });
      } finally {
        setRollbackLoading(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import_logs'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imports || imports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No imports yet. Upload a file to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {imports.map((importLog) => (
        <div
          key={importLog.id}
          className="bg-white border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {importLog.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm truncate">{importLog.file_name}</p>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {importLog.entity_type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {importLog.record_count} record{importLog.record_count !== 1 ? 's' : ''} created •{' '}
                {format(new Date(importLog.created_date), 'MMM d, yyyy h:mm a')}
              </p>
              {importLog.status === 'failed' && importLog.error_message && (
                <p className="text-xs text-destructive mt-1">{importLog.error_message}</p>
              )}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={rollbackLoading === importLog.id}
                className="flex-shrink-0 ml-2"
              >
                {rollbackLoading === importLog.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Rollback import?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {importLog.record_count} record{importLog.record_count !== 1 ? 's' : ''} from this import and remove the import log. This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex gap-3 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => rollbackMutation.mutate(importLog)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Rollback
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}