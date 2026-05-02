import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DataExport() {
  const { campaign } = useCampaign();
  const [entityType, setEntityType] = useState('contacts');
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const entities = [
    { value: 'contacts', label: '👥 Contacts', description: 'Voter database with support levels' },
    { value: 'turfs', label: '🗺️ Turfs', description: 'Geographic canvassing zones' },
    { value: 'canvassing_logs', label: '📋 Canvassing Logs', description: 'Session records & feedback' },
    { value: 'interactions', label: '💬 Interactions', description: 'Door knocks, calls, emails' },
    { value: 'tasks', label: '✅ Tasks', description: 'Campaign to-dos and deadlines' },
    { value: 'events', label: '📅 Events', description: 'Campaign events and meetings' },
    { value: 'leaflet_runs', label: '📬 Leaflet Runs', description: 'Distribution progress by street' },
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportCampaignData', {
        entity_type: entityType,
        format,
        filter_campaign_id: campaign?.id,
      });

      // The function returns the file as a response, so we need to trigger download
      const res = await fetch(
        `${window.location.origin}/api/functions/exportCampaignData`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            format,
            filter_campaign_id: campaign?.id,
          }),
        }
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${entityType}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setLastExport(new Date());
      } else {
        alert('Export failed: ' + (await res.text()));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Data Export</h1>
          <p className="text-muted-foreground">
            Download your campaign data in CSV or JSON format. All data belongs to you.
          </p>
        </div>

        {/* Campaign info */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Current campaign:</p>
          <p className="text-lg font-semibold">{campaign?.name || 'No campaign selected'}</p>
        </div>

        {/* Entity selector */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            What to export
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entities.map(e => (
              <button
                key={e.value}
                onClick={() => setEntityType(e.value)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  entityType === e.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <p className="font-medium text-base">{e.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format selector */}
        <div className="space-y-3">
          <h3 className="font-medium">Format</h3>
          <div className="flex gap-3">
            {[
              { value: 'csv', label: 'CSV (Excel)', icon: '📊' },
              { value: 'json', label: 'JSON (API-ready)', icon: '{ }' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  format === f.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="mr-2">{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export button */}
        <div className="space-y-4">
          <Button
            onClick={handleExport}
            disabled={exporting || !campaign}
            className="w-full py-6 text-lg gap-2"
            size="lg"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing export…
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export {entities.find(e => e.value === entityType)?.label}
              </>
            )}
          </Button>

          {lastExport && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Exported at {lastExport.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            About data exports
          </h3>
          <ul className="text-sm text-blue-800 space-y-1.5 ml-6 list-disc">
            <li>Your data is <strong>yours to own</strong> — export anytime, anywhere</li>
            <li>Exports include all historical records and metadata</li>
            <li>CSV format opens in Excel, Sheets, Numbers</li>
            <li>JSON format is ready for API integration or third-party tools</li>
            <li>No sensitive passwords or auth tokens are included</li>
          </ul>
        </div>
      </div>
    </div>
  );
}