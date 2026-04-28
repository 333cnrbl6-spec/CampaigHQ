import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SmartDropZone from '@/components/import/SmartDropZone';
import FieldMapper from '@/components/import/FieldMapper';
import ExtractionPreview from '@/components/import/ExtractionPreview';
import RecentImports from '@/components/import/RecentImports';

const ENTITIES = {
  Contact: { icon: '👥', description: 'Voter contacts and contact details' },
  Issue: { icon: '📋', description: 'Local issues and policy positions' },
  CampaignEvent: { icon: '📅', description: 'Campaign events and activities' },
  Task: { icon: '✅', description: 'Tasks and action items' },
  ContactInteraction: { icon: '💬', description: 'Contact interactions and history' },
  LeafletRun: { icon: '📄', description: 'Leaflet distribution runs' },
};

export default function DataImport() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(null); // 'extracting', 'analyzing', or null
  const [detectedEntity, setDetectedEntity] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [schema, setSchema] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [textConfirmed, setTextConfirmed] = useState(false);

  const handleFileSelected = async (file) => {
    setProcessing(true);
    setProcessingStep('extracting');
    setError(null);
    setDetectedEntity(null);
    setCurrentFile(file);
    setTextConfirmed(false);

    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(uploadRes.file_url);

      // Extract all text/content from the document
      const textRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract ALL text and content from this document. Return the complete extracted text.`,
        file_urls: [uploadRes.file_url],
      });

      setExtractedText(textRes);
    } catch (err) {
      setError(err.message || 'Failed to extract document content');
      setProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleTextConfirmed = async () => {
    if (!fileUrl) return;
    
    setProcessingStep('analyzing');

    try {
      // AI determines the entity type based on extracted text
      const detectionRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this document content, determine which entity type it contains. Choose from: ${Object.keys(ENTITIES).join(', ')}.
        
Return a JSON object with:
- "entity_type": the best matching entity name
- "confidence": 0-100 confidence score
- "reason": brief explanation of why this entity type matches`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            entity_type: { type: 'string' },
            confidence: { type: 'number' },
            reason: { type: 'string' },
          },
        },
      });

      setDetectedEntity(detectionRes);
      setSelectedEntity(detectionRes.entity_type);
      
      // Fetch schema for the detected entity
      const entitySchema = await base44.entities[detectionRes.entity_type].schema();
      setSchema(entitySchema);
    } catch (err) {
      setError(err.message || 'Failed to analyze file');
    } finally {
      setProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleImport = async (fieldMapping) => {
    if (!selectedEntity || !fileUrl) return;

    setProcessing(true);
    setError(null);

    try {
      const mappingInstructions = Object.entries(fieldMapping)
        .map(([sourceCol, targetField]) => `"${sourceCol}" → "${targetField}"`)
        .join(', ');

      // Extract and import with user-defined mapping
      const extractRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all records from this file using this field mapping: ${mappingInstructions}.
        
Map each source column to its corresponding target field. Only include mapped fields in the output. Return valid records only.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            records: { type: 'array', items: { type: 'object' } },
          },
        },
      });

      const records = extractRes.records || [];
      if (records.length > 0) {
        const createdRecords = await base44.entities[selectedEntity].bulkCreate(records);
        const recordIds = createdRecords.map(r => r.id) || [];
        
        // Log the import
        await base44.entities.ImportLog.create({
          file_name: currentFile.name,
          entity_type: selectedEntity,
          record_count: records.length,
          status: 'completed',
          created_record_ids: recordIds,
        });
        
        queryClient.invalidateQueries({ queryKey: [selectedEntity.toLowerCase()] });
        queryClient.invalidateQueries({ queryKey: ['import_logs'] });
        setStatus({ count: records.length, entity: selectedEntity });
        setError(null);
        setTimeout(() => {
          setStatus(null);
          setDetectedEntity(null);
          setSelectedEntity(null);
          setCurrentFile(null);
          setFileUrl(null);
          setSchema(null);
          setExtractedText(null);
          setTextConfirmed(false);
        }, 4000);
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
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Drop any file and AI will automatically detect the data type and import it for you.
        </p>
      </div>

      <div className="space-y-6">
        <SmartDropZone onFileSelected={handleFileSelected} processing={processing} />

        {processingStep === 'extracting' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-900">Extracting content...</p>
                <p className="text-sm text-blue-700 mt-1">AI is reading the document</p>
              </div>
            </div>
          </div>
        )}

        {processingStep === 'analyzing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-900">Analyzing content...</p>
                <p className="text-sm text-blue-700 mt-1">AI is determining the data type</p>
              </div>
            </div>
          </div>
        )}

        {extractedText && !detectedEntity && !textConfirmed && (
          <ExtractionPreview
            extractedText={extractedText}
            fileName={currentFile?.name}
            onProceed={() => {
              setTextConfirmed(true);
              handleTextConfirmed();
            }}
          />
        )}

        {status ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Import successful</p>
                <p className="text-sm text-green-700 mt-1">
                  {status.count} {status.entity.toLowerCase()} record{status.count !== 1 ? 's' : ''} imported
                </p>
              </div>
            </div>
          </div>
        ) : detectedEntity ? (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <p className="font-semibold">Data type detected</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ENTITIES[detectedEntity.entity_type]?.icon || '📋'}</span>
                <div>
                  <p className="font-semibold">{detectedEntity.entity_type}</p>
                  <p className="text-sm text-muted-foreground">{detectedEntity.reason}</p>
                  <p className="text-xs text-primary mt-1">
                    Confidence: {detectedEntity.confidence}%
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-primary/10">
                <label className="text-sm font-medium">Or select a different entity:</label>
                <Select value={selectedEntity} onValueChange={(value) => {
                  setSelectedEntity(value);
                  // Fetch new schema when entity changes
                  base44.entities[value].schema().then(setSchema);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITIES).map(([name, info]) => (
                      <SelectItem key={name} value={name}>
                        {info.icon} {name} — {info.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {schema && selectedEntity && (
              <FieldMapper
                fileUrl={fileUrl}
                entityName={selectedEntity}
                schema={schema}
                onConfirm={handleImport}
                loading={processing}
              />
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDetectedEntity(null);
                  setSelectedEntity(null);
                  setError(null);
                  setCurrentFile(null);
                  setSchema(null);
                  setExtractedText(null);
                  setTextConfirmed(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {error && !detectedEntity && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="font-heading text-2xl font-bold mb-4">Recent Imports</h2>
        <RecentImports />
      </div>
    </div>
  );
}