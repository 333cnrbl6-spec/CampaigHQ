import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SmartDataImporter from '@/components/import/SmartDataImporter';

const IMPORTABLE_ENTITIES = [
  { name: 'Contact', icon: '👥', description: 'Voter contacts and contact details' },
  { name: 'Issue', icon: '📋', description: 'Local issues and policy positions' },
  { name: 'CampaignEvent', icon: '📅', description: 'Campaign events and activities' },
  { name: 'Task', icon: '✅', description: 'Tasks and action items' },
  { name: 'ContactInteraction', icon: '💬', description: 'Contact interactions and history' },
  { name: 'LeafletRun', icon: '📄', description: 'Leaflet distribution runs' },
];

export default function DataImport() {
  const [completedImports, setCompletedImports] = useState({});

  const handleImportComplete = (entityName, count) => {
    setCompletedImports((prev) => ({
      ...prev,
      [entityName]: { count, timestamp: new Date() },
    }));
    setTimeout(() => {
      setCompletedImports((prev) => {
        const updated = { ...prev };
        delete updated[entityName];
        return updated;
      });
    }, 3000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Upload and import data from CSV, Excel, JSON, PDF, or images. Our AI will automatically
          extract and validate your data.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {IMPORTABLE_ENTITIES.map((entity) => (
          <Card key={entity.name} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{entity.icon}</span>
                <div>
                  <h3 className="font-semibold">{entity.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{entity.description}</p>
                </div>
              </div>
            </div>

            {completedImports[entity.name] && (
              <div className="mb-3 flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-lg p-2 border border-primary/20">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>
                  {completedImports[entity.name].count} imported
                </span>
              </div>
            )}

            <SmartDataImporter
              entityName={entity.name}
              onComplete={(count) => handleImportComplete(entity.name, count)}
              trigger={{
                type: Button,
                props: {
                  variant: 'outline',
                  className: 'w-full gap-2',
                  children: [<Upload key="icon" className="w-4 h-4" />, 'Import Data'],
                },
              }}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}