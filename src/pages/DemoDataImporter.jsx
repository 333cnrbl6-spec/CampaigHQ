import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Loader2, Download } from 'lucide-react';

export default function DemoDataImporter() {
  const { campaign } = useCampaign();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);

  const importMutation = useMutation({
    mutationFn: async () => {
      // Generate demo contacts
      const contacts = [];
      const areas = ['North', 'South', 'East', 'West', 'Central'];
      const supportLevels = ['strong_supporter', 'leaning', 'undecided', 'opposed', 'unknown'];
      const streets = ['High Street', 'Main Road', 'Park Lane', 'Oak Avenue', 'Mill Street'];

      for (let i = 0; i < 500; i++) {
        const area = areas[Math.floor(Math.random() * areas.length)];
        const street = streets[Math.floor(Math.random() * streets.length)];
        contacts.push({
          campaign_id: campaign.id,
          name: `Demo Voter ${i + 1}`,
          address: `${Math.floor(Math.random() * 200) + 1} ${street}`,
          postcode: `M${Math.floor(Math.random() * 30) + 1} ${Math.floor(Math.random() * 9)}AA`,
          phone: `07${Math.floor(Math.random() * 900000000) + 100000000}`,
          email: `voter${i + 1}@example.com`,
          registered_voter: Math.random() > 0.2,
          support_level: supportLevels[Math.floor(Math.random() * supportLevels.length)],
          notes: `Demo contact from ${area} area`,
          tags: ['demo', area.toLowerCase()],
          consent_given: true,
          consent_date: new Date().toISOString().split('T')[0],
        });
      }

      // Import contacts
      await base44.entities.Contact.bulkCreate(contacts);

      // Generate demo turfs
      const turfs = [
        { campaign_id: campaign.id, name: 'North Block A', status: 'unassigned', color: '#FF6B6B' },
        { campaign_id: campaign.id, name: 'South Block B', status: 'unassigned', color: '#4ECDC4' },
        { campaign_id: campaign.id, name: 'East Block C', status: 'unassigned', color: '#45B7D1' },
        { campaign_id: campaign.id, name: 'West Block D', status: 'unassigned', color: '#FFA07A' },
      ];

      await base44.entities.Turf.bulkCreate(turfs);

      // Generate demo tasks
      const tasks = [
        { campaign_id: campaign.id, title: 'Canvass North Block', status: 'todo', priority: 'high', category: 'canvassing' },
        { campaign_id: campaign.id, title: 'Leaflet delivery prep', status: 'todo', priority: 'medium', category: 'communications' },
        { campaign_id: campaign.id, title: 'Volunteer training', status: 'todo', priority: 'high', category: 'admin' },
        { campaign_id: campaign.id, title: 'Social media content', status: 'in_progress', priority: 'medium', category: 'communications' },
      ];

      await base44.entities.Task.bulkCreate(tasks);

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['turfs'] });
    },
  });

  const handleImportDemo = async () => {
    setImporting(true);
    try {
      await importMutation.mutateAsync();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">Demo Data Importer</h1>
          <p className="text-muted-foreground mt-2">Load sample data to explore and demonstrate the platform.</p>
        </div>

        {/* Demo Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>Load Demo Campaign Data</CardTitle>
            <CardDescription>
              Creates 500 sample contacts, 4 turfs, and 4 tasks to explore features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* What Gets Created */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">What will be created:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ <strong>500 sample voter contacts</strong> with realistic names, addresses, postcodes, and support levels</li>
                <li>✓ <strong>4 geographic turfs</strong> (North, South, East, West) ready for assignment</li>
                <li>✓ <strong>4 demo tasks</strong> including canvassing, leafleting, and training</li>
                <li>✓ All contacts marked with <strong>consent given</strong> (GDPR-ready)</li>
              </ul>
            </div>

            {/* Sample Data Preview */}
            <div className="p-4 bg-secondary/30 rounded-lg space-y-2 text-xs">
              <p className="font-mono">
                <strong>Sample Contact:</strong><br />
                Name: Demo Voter 42<br />
                Address: 145 High Street<br />
                Postcode: M12 4AA<br />
                Support Level: Leaning<br />
                Consent: ✓ Given
              </p>
            </div>

            {/* Import Button */}
            <Button
              onClick={handleImportDemo}
              disabled={importing || importMutation.isPending}
              className="w-full"
              size="lg"
            >
              {importing || importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Importing Demo Data...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Load Demo Data
                </>
              )}
            </Button>

            {importMutation.isSuccess && (
              <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                ✓ Demo data imported successfully! Check Contacts, Turfs, and Tasks to explore.
              </div>
            )}

            {importMutation.isError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                ✗ Import failed: {importMutation.error?.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">After importing:</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm list-decimal list-inside text-muted-foreground">
              <li>View Dashboard to see campaign stats</li>
              <li>Check Contacts to see the 500 sample voters</li>
              <li>Explore Turf Management to see geographic areas</li>
              <li>Try assigning contacts to turfs</li>
              <li>View Leaderboard to see performance metrics</li>
              <li>Test the Mobile Field app with demo data</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}