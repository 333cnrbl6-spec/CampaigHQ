import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SmartDropZone from '@/components/import/SmartDropZone';

const IMPORTABLE_ENTITIES = [
  { name: 'Contact', icon: '👥', description: 'Voter contacts and contact details' },
  { name: 'Issue', icon: '📋', description: 'Local issues and policy positions' },
  { name: 'CampaignEvent', icon: '📅', description: 'Campaign events and activities' },
  { name: 'Task', icon: '✅', description: 'Tasks and action items' },
  { name: 'ContactInteraction', icon: '💬', description: 'Contact interactions and history' },
  { name: 'LeafletRun', icon: '📄', description: 'Leaflet distribution runs' },
];

function EntityImportCard({ entity, onComplete }) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelected = async (file) => {
    setProcessing(true);
    setError(null);
    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;

      // Get schema
      const schema = await base44.entities[entity.name].schema();

      // Analyze and extract with AI
      const analysisRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract data from this file and map to schema fields: ${JSON.stringify(schema.properties || {})}. Return valid records as JSON array.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            records: { type: 'array', items: { type: 'object' } },
          },
        },
      });

      const records = analysisRes.records || [];
      if (records.length > 0) {
        await base44.entities[entity.name].bulkCreate(records);
        setStatus({ count: records.length, timestamp: new Date() });
        if (onComplete) onComplete(records.length);
        setTimeout(() => setStatus(null), 3000);
      } else {
        setError('No valid records found in file');
      }
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{entity.icon}</span>
          <div>
            <h3 className="font-semibold">{entity.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{entity.description}</p>
          </div>
        </div>
      </div>

      {status && (
        <div className="mb-4 flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-lg p-2 border border-primary/20">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{status.count} imported</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg p-2 border border-destructive/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      <SmartDropZone onFileSelected={handleFileSelected} processing={processing} />
    </Card>
  );
}

export default function DataImport() {
  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Drop your file on any entity to import. AI automatically extracts and validates your data.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {IMPORTABLE_ENTITIES.map((entity) => (
          <EntityImportCard key={entity.name} entity={entity} />
        ))}
      </div>
    </div>
  );
}