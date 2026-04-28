import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PollingMap() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold font-heading leading-tight">Polling Districts & Stations</h1>
            <p className="text-xs text-muted-foreground">Wigan Borough — Official Wigan Council Data</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open('https://experience.arcgis.com/experience/42fe06432cab483587ee2d16c80b27d3', '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Open Full Screen
        </Button>
      </div>

      {/* Embedded ArcGIS Map */}
      <div className="flex-1 relative">
        <iframe
          src="https://experience.arcgis.com/experience/42fe06432cab483587ee2d16c80b27d3"
          title="Polling Districts and Stations within Wigan Borough"
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}