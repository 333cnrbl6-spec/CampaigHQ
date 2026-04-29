import { useState } from 'react';
import { Layers, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TurfOverlayControls({ turfs, overlayStates, onToggle, onOpacityChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const turfWithGeo = turfs.filter(t => t.geojson);
  if (turfWithGeo.length === 0) return null;

  const activeCount = turfWithGeo.filter(t => overlayStates[t.id]?.visible).length;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Map Overlays
          {activeCount > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-semibold">
              {activeCount} on
            </span>
          )}
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="border-t border-border divide-y divide-border/60">
          {turfWithGeo.map(turf => {
            const state = overlayStates[turf.id] || { visible: false, opacity: 0.4 };
            return (
              <div key={turf.id} className="px-3 py-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggle(turf.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0 border border-border/50"
                      style={{ backgroundColor: turf.color || '#16a34a' }}
                    />
                    <span className="text-xs font-medium truncate flex-1">{turf.name}</span>
                    {state.visible
                      ? <Eye className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      : <EyeOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    }
                  </button>
                </div>
                {state.visible && (
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-xs text-muted-foreground w-14">Opacity</span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.85"
                      step="0.05"
                      value={state.opacity}
                      onChange={e => onOpacityChange(turf.id, parseFloat(e.target.value))}
                      className="flex-1 h-1.5 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {Math.round(state.opacity * 100)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}