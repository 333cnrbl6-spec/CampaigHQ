import React from 'react';
import LiveVolunteerMap from '@/components/map/LiveVolunteerMap';

export default function LiveTracking() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold">Live Field Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor volunteer locations and canvassing activity in real-time
          </p>
        </div>

        {/* Live map */}
        <LiveVolunteerMap />

        {/* Info panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 How it works</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>Volunteer locations update automatically as they walk their route</li>
            <li>Green markers = recently active (within 15 minutes)</li>
            <li>Amber markers = idle (no activity for 15+ minutes)</li>
            <li>Click markers for details: doors knocked, current turf, battery level</li>
          </ul>
        </div>
      </div>
    </div>
  );
}