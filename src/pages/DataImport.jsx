import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartDropZone from '@/components/import/SmartDropZone';
import ImportProgress from '@/components/import/ImportProgress';
import ExtractionPreview from '@/components/import/ExtractionPreview';
import DatabaseAssessment from '@/components/import/DatabaseAssessment';
import RecentImports from '@/components/import/RecentImports';

export default function DataImport() {
  const queryClient = useQueryClient();
  
  // Fetch last import log to get the file URL
  const { data: lastImportLog } = useQuery({
    queryKey: ['import_logs'],
    queryFn: () => base44.entities.ImportLog.list('-created_date', 1),
    initialData: [],
  });

  // Stage tracking
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);

  // Data flow
  const [currentFile, setCurrentFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [textConfirmed, setTextConfirmed] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  // Processing
  const [loading, setLoading] = useState(false);

  const markStageComplete = (stage) => {
    setCompletedStages(prev => [...new Set([...prev, stage])]);
  };

  // Load last imported file
  const handleLoadLastImport = async () => {
    if (!lastImportLog?.[0]?.file_url) return;
    
    const log = lastImportLog[0];
    setCurrentFile({ name: log.file_name });
    setFileUrl(log.file_url);
    setCurrentStage(1);
    
    // Auto-extract text
    setLoading(true);
    try {
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: log.file_url,
        json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'All text and content from the file' },
          },
        },
      });

      if (extractRes.status === 'success' && extractRes.output?.content) {
        setExtractedText(extractRes.output.content);
        markStageComplete(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  // Stage 1: Upload & Extract
  const handleFileSelected = async (file) => {
    setCurrentStage(1);
    setError(null);
    setExtractedText(null);
    setTextConfirmed(false);
    setAssessment(null);
    setLoading(true);

    try {
      setCurrentFile(file);

      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(uploadRes.file_url);

      // Extract text from all file types
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'All text and content from the file' },
          },
        },
      });

      if (extractRes.status === 'success' && extractRes.output?.content) {
        setExtractedText(extractRes.output.content);
        markStageComplete(1);
      } else {
        setError(extractRes.details || 'Failed to extract document content');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and extract file');
    } finally {
      setLoading(false);
    }
  };

  // Stage 2: Analyze Structure
  const handleTextConfirmed = async () => {
    if (!fileUrl) return;

    setCurrentStage(2);
    setLoading(true);
    setError(null);

    try {
      // AI analyzes the data structure and suggests database schema
      const analysisRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this dataset and provide a comprehensive assessment:

1. What does this data represent?
2. What are the main fields/columns?
3. What is the data type of each field (string, number, date, boolean, etc)?
4. What percentage of each field is filled (data quality)?
5. Are there any obvious relationships between fields?
6. What entity type would best represent this data?

Return a structured JSON assessment with:
- recordCount (estimated number of rows)
- fields (array of {name, type, samples, filledPercentage})
- explanation (paragraph describing what the data represents)
- suggestedEntity (best matching entity type)
- confidence (0-100 confidence score)`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            recordCount: { type: 'number' },
            fields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  samples: { type: 'array', items: { type: 'string' } },
                  filledPercentage: { type: 'number' },
                },
              },
            },
            explanation: { type: 'string' },
            suggestedEntity: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
      });

      if (analysisRes && analysisRes.fields) {
        setAssessment(analysisRes);
        markStageComplete(2);
        setCurrentStage(3);
      } else {
        setError('Failed to analyze data structure');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze file');
    } finally {
      setLoading(false);
    }
  };

  // Stage 4: Import
  const handleConfirmImport = async (fieldOverrides) => {
    if (!fileUrl || !assessment) return;

    setCurrentStage(4);
    setLoading(true);
    setError(null);

    try {
      // Build field mapping instructions with any user overrides
      const fieldMapping = assessment.fields.reduce((acc, field) => {
        const override = fieldOverrides[field.name];
        const finalName = override?.name || field.name;
        acc[field.name] = finalName;
        return acc;
      }, {});

      const mappingInstructions = Object.entries(fieldMapping)
        .map(([source, target]) => `"${source}" → "${target}"`)
        .join(', ');

      // Extract records with confirmed mapping
      const extractRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all records from this file using this field mapping: ${mappingInstructions}.
        
Map each source column to its corresponding target field. Return ONLY valid, complete records as an array of JSON objects. Do not include incomplete or invalid records.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            records: { type: 'array', items: { type: 'object' } },
          },
        },
      });

      const records = extractRes.records || [];

      if (records.length === 0) {
        setError('No valid records could be extracted');
        return;
      }

      // Create records in the database
      const entityName = assessment.suggestedEntity || 'Contact';
      const createdRecords = await base44.entities[entityName].bulkCreate(records);
      const recordIds = createdRecords.map(r => r.id) || [];

      // Log the import
      await base44.entities.ImportLog.create({
        file_name: currentFile.name,
        file_url: fileUrl,
        entity_type: entityName,
        record_count: records.length,
        status: 'completed',
        created_record_ids: recordIds,
      });

      queryClient.invalidateQueries({ queryKey: [entityName.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['import_logs'] });

      markStageComplete(4);
      setImportStatus({ count: records.length, entity: entityName });

      // Reset after 4 seconds
      setTimeout(() => {
        setCurrentStage(0);
        setCompletedStages([]);
        setCurrentFile(null);
        setFileUrl(null);
        setExtractedText(null);
        setTextConfirmed(false);
        setAssessment(null);
        setImportStatus(null);
      }, 4000);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Smart Data Import</h1>
        <p className="text-muted-foreground">
          Upload any file and AI will guide you through a complete, foolproof data import process.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Progress sidebar */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border p-6 h-fit sticky top-6">
          <h3 className="font-semibold mb-4">Import Progress</h3>
          <ImportProgress currentStage={currentStage} completedStages={completedStages} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stage 1: Upload */}
          {currentStage === 0 && (
            <div className="space-y-4">
              <SmartDropZone onFileSelected={handleFileSelected} processing={loading} />
              
              {lastImportLog?.[0]?.file_url && (
                <div className="bg-accent/10 border border-accent rounded-xl p-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Last imported file</p>
                    <p className="text-xs text-muted-foreground mt-1">{lastImportLog[0].file_name}</p>
                  </div>
                  <Button
                    onClick={handleLoadLastImport}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Repeat2 className="w-4 h-4 mr-2" />
                    Load & Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Stage 1: Show extraction preview */}
          {currentStage === 1 && extractedText && !textConfirmed && (
            <ExtractionPreview
              extractedText={extractedText}
              fileName={currentFile?.name}
              onProceed={() => {
                setTextConfirmed(true);
                handleTextConfirmed();
              }}
            />
          )}

          {/* Stage 3: Database Assessment */}
          {currentStage === 3 && assessment && (
            <DatabaseAssessment
              assessment={assessment}
              onConfirm={handleConfirmImport}
              loading={loading}
            />
          )}

          {/* Success state */}
          {importStatus && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3 text-center">
              <p className="font-semibold text-green-900">✓ Import Successful</p>
              <p className="text-sm text-green-700">
                {importStatus.count} {importStatus.entity} record{importStatus.count !== 1 ? 's' : ''} imported
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-3 text-sm text-primary bg-primary/5 rounded-lg p-4 border border-primary/20">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Recent imports */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="font-heading text-2xl font-bold mb-4">Recent Imports</h2>
        <RecentImports />
      </div>
    </div>
  );
}