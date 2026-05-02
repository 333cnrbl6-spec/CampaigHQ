import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Zap, X, Database } from 'lucide-react';

export default function GeocodePanel({ onClose }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(null);
  const [finished, setFinished] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-geocode-check'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
    staleTime: 10000,
  });

  // latitude=0 is a "geocode failed" sentinel — exclude from both counts
  const geocodedCount = contacts.filter(c => c.latitude != null && c.latitude !== 0).length;
  const failedCount = contacts.filter(c => c.latitude === 0).length;
  const addressedCount = contacts.filter(c => c.address?.trim() || c.postcode?.trim()).length;
  const remaining = addressedCount - geocodedCount - failedCount;

  async function runGeocode() {
    setRunning(true);
    setFinished(false);
    setDone(geocodedCount);
    setTotal(addressedCount);

    let moreRemaining = true;
    let currentDone = geocodedCount;

    while (moreRemaining) {
      const res = await base44.functions.invoke('batchGeocodeContacts', {});
      const r = res.data?.results;
      moreRemaining = r?.more_remaining ?? false;
      const succeeded = r?.succeeded ?? 0;
      currentDone += succeeded;
      setDone(currentDone);

      // If nothing succeeded this round, all remaining have invalid postcodes — stop
      if (succeeded === 0) break;

      if (moreRemaining) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    setFinished(true);
    setRunning(false);
  }

  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-96 bg-card border rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Database className="w-4 h-4" />
          Geocode Contact Database
        </div>
        {!running && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-muted rounded-lg p-2">
            <div className="text-lg font-bold text-foreground">{addressedCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-lg font-bold text-green-700">{geocodedCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Geocoded</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-2">
            <div className="text-lg font-bold text-amber-700">{remaining.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="text-lg font-bold text-red-600">{failedCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">No postcode</div>
          </div>
        </div>

        {/* Progress bar (shown while running or finished) */}
        {(running || finished) && total != null && (
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{done.toLocaleString()} of {total.toLocaleString()} geocoded</span>
              <span>{pct}%</span>
            </div>
          </div>
        )}

        {finished && (
          <p className="text-sm text-green-700 font-medium text-center">
            ✓ Done! {failedCount > 0 ? `${failedCount} contacts had no valid postcode and were skipped.` : 'All contacts geocoded successfully.'}
          </p>
        )}

        {!finished && remaining === 0 && !running && (
          <p className="text-sm text-green-700 font-medium text-center">
            ✓ All addressable contacts are geocoded.{failedCount > 0 ? ` (${failedCount} skipped — no valid postcode)` : ''}
          </p>
        )}

        {!finished && (
          <Button
            className="w-full gap-2"
            onClick={runGeocode}
            disabled={running || remaining === 0}
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Geocoding… ({done.toLocaleString()} done)
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {remaining === 0 ? 'All Done' : `Geocode ${remaining.toLocaleString()} Contacts`}
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Coordinates are saved permanently — this only needs to run once.
        </p>
      </div>
    </div>
  );
}