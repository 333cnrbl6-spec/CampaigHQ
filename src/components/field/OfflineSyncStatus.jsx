import React from 'react';
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OfflineSyncStatus({ isOnline, queuedCount, isSyncing, lastSyncTime, onManualSync }) {
  if (isOnline && queuedCount === 0 && !isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-green-700">Connected & synced</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-3 rounded-lg border text-xs space-y-2',
      isOnline 
        ? 'bg-blue-50 border-blue-200'
        : 'bg-amber-50 border-amber-200'
    )}>
      {/* Connection status */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Cloud className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700">Connected</span>
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700">Offline Mode</span>
          </>
        )}
      </div>

      {/* Queue status */}
      {queuedCount > 0 && (
        <div className="flex items-center justify-between">
          <span className={isOnline ? 'text-blue-700' : 'text-amber-700'}>
            {queuedCount} {queuedCount === 1 ? 'log' : 'logs'} queued
          </span>
          {isOnline && !isSyncing && (
            <Button 
              onClick={onManualSync} 
              size="sm" 
              variant="ghost"
              className="text-xs h-6 px-2"
            >
              Sync now
            </Button>
          )}
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-blue-700">Syncing logs...</span>
        </div>
      )}

      {/* Last sync info */}
      {lastSyncTime && (
        <p className="text-xs text-muted-foreground">
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}