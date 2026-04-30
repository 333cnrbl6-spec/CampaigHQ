import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Repeat2, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartDropZone from '@/components/import/SmartDropZone';
import ImportProgress from '@/components/import/ImportProgress';
import ExtractionPreview from '@/components/import/ExtractionPreview';
import DatabaseAssessment from '@/components/import/DatabaseAssessment';
import RecentImports from '@/components/import/RecentImports';
import ValidationResults from '@/components/import/ValidationResults';

const isLegacyMapFile = (filename) => /\.docx?$/i.test(filename);

export default function DataImport() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [legacyFileDetected, setLegacyFileDetected] = useState(null);
  
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
  const [extractedRecords, setExtractedRecords] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  // Processing
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null); // human-readable current action

  // Auto-load last import on mount
  useEffect(() => {
    if (lastImportLog?.[0]?.file_url && currentStage === 0 && !currentFile) {
      handleLoadLastImport();
    }
  }, [lastImportLog]);

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
        setTextConfirmed(true);
        await runStructureAnalysis(log.file_url);
      }
    } catch (err) {
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  // Stage 1: Upload & Extract
  const handleFileSelected = async (file) => {
    // Intercept DOCX files — route to legacy map importer
    if (isLegacyMapFile(file.name)) {
      setLegacyFileDetected(file.name);
      return;
    }

    setCurrentStage(1);
    setError(null);
    setExtractedText(null);
    setTextConfirmed(false);
    setAssessment(null);
    setLoading(true);

    try {
      setCurrentFile(file);

      // Step 1: Upload
      setLoadingStep({ step: 1, total: 2, label: 'Uploading your file…', detail: 'Sending file to secure storage — this may take a moment for larger files.' });
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(uploadRes.file_url);

      // Step 2: Extract text
      setLoadingStep({ step: 2, total: 2, label: 'Reading and extracting content…', detail: 'AI is scanning your file to pull out all text, rows and data — please keep this tab open.' });
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
        // Auto-proceed to stage 2 (AI structure analysis) — no manual confirmation needed
        setTextConfirmed(true);
        await runStructureAnalysis(uploadRes.file_url);
      } else {
        setError(extractRes.details || 'Failed to extract document content');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and extract file');
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  // Stage 2: Analyze Structure — called automatically after extraction
  const runStructureAnalysis = async (resolvedFileUrl) => {
    const url = resolvedFileUrl || fileUrl;
    if (!url) return;

    setCurrentStage(2);
    setLoading(true);
    setError(null);
    setLoadingStep({ step: 1, total: 1, label: 'AI is analysing your data structure…', detail: 'This usually takes 15–30 seconds. AI is working out what fields, data types and records are in your file.' });

    try {
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
        file_urls: [url],
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
      setLoadingStep(null);
    }
  };

  const handleTextConfirmed = () => runStructureAnalysis();

  // Stage 4: Extract & Validate Records
  const handleConfirmImport = async (fieldOverrides) => {
    if (!fileUrl || !assessment) return;

    setCurrentStage(4);
    setLoading(true);
    setError(null);
    setLoadingStep({ step: 1, total: 2, label: 'Extracting all records from your file…', detail: 'AI is reading every row and mapping it to the correct fields. Large files can take up to a minute — please wait.' });

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
        
Map each source column to its corresponding target field. Return ALL records as an array of JSON objects, including incomplete or invalid ones for validation review.`,
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
        setError('No records could be extracted from the file');
        return;
      }

      setExtractedRecords(records);
      setLoadingStep({ step: 2, total: 2, label: 'Validating records…', detail: `Checking all ${records.length} extracted records against the database schema for errors.` });

      // Validate records against entity schema
      const entityName = assessment.suggestedEntity || 'Contact';
      const entitySchema = await base44.entities[entityName].schema();
      
      const validationErrors = [];
      const validRecords = [];

      records.forEach((record, idx) => {
        const recordErrors = [];

        // Check required fields
        if (entitySchema.required) {
          entitySchema.required.forEach(field => {
            if (record[field] === undefined || record[field] === null || 
                (typeof record[field] === 'string' && record[field].trim() === '')) {
              recordErrors.push(`Missing required field: ${field}`);
            }
          });
        }

        // Check data types and enums
        Object.entries(entitySchema.properties || {}).forEach(([field, fieldSchema]) => {
          if (!(field in record)) return;
          const value = record[field];

          if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
            recordErrors.push(`Field "${field}": "${value}" must be one of: ${fieldSchema.enum.join(', ')}`);
          }

          if (fieldSchema.type === 'number' && isNaN(Number(value))) {
            recordErrors.push(`Field "${field}": "${value}" is not a valid number`);
          }

          if (fieldSchema.format === 'date' && value && !/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
            recordErrors.push(`Field "${field}": date must be in YYYY-MM-DD format`);
          }
        });

        if (recordErrors.length > 0) {
          validationErrors.push({ recordIndex: idx + 1, errors: recordErrors, record });
        } else {
          validRecords.push(record);
        }
      });

      setValidationResult({
        total: records.length,
        valid: validRecords.length,
        invalid: validationErrors,
        entityName,
      });

      markStageComplete(4);
    } catch (err) {
      setError(err.message || 'Failed to extract and validate records');
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  // Stage 5: Final Import (after validation approval)
  const handleFinalImport = async () => {
    if (!validationResult?.valid || validationResult.valid === 0) {
      setError('No valid records to import');
      return;
    }

    setLoading(true);
    try {
      const validRecords = validationResult.valid
        ? extractedRecords.filter((_, idx) => !validationResult.invalid.some(err => err.recordIndex === idx + 1))
        : [];

      const createdRecords = await base44.entities[validationResult.entityName].bulkCreate(validRecords);
      const recordIds = createdRecords.map(r => r.id) || [];

      // Log the import
      await base44.entities.ImportLog.create({
        file_name: currentFile.name,
        file_url: fileUrl,
        entity_type: validationResult.entityName,
        record_count: recordIds.length,
        status: 'completed',
        created_record_ids: recordIds,
      });

      queryClient.invalidateQueries({ queryKey: [validationResult.entityName.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['import_logs'] });

      setImportStatus({ count: recordIds.length, entity: validationResult.entityName });

      // Reset after 4 seconds
      setTimeout(() => {
        setCurrentStage(0);
        setCompletedStages([]);
        setCurrentFile(null);
        setFileUrl(null);
        setExtractedText(null);
        setTextConfirmed(false);
        setAssessment(null);
        setExtractedRecords(null);
        setValidationResult(null);
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
              {legacyFileDetected && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 text-sm">Legacy map file detected</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      <strong>{legacyFileDetected}</strong> looks like a legacy DOCX map file. Use the dedicated importer to extract streets and create Turf + Leaflet Run records.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/legacy-import')} className="gap-1.5 flex-shrink-0">
                    Open Importer <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
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

          {/* Stage 1: Show extraction preview (only if not yet auto-confirmed) */}
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

          {/* Stage 1 complete banner — visible while stage 2 is loading */}
          {currentStage === 2 && extractedText && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">✓ Stage 1 complete — file extracted successfully</p>
                <p className="text-xs text-green-700 mt-0.5">
                  AI is now analysing the data structure to identify fields and record types. This usually takes 20–40 seconds…
                </p>
              </div>
            </div>
          )}

          {/* Stage 3: Database Assessment */}
          {currentStage === 3 && assessment && !validationResult && (
            <DatabaseAssessment
              assessment={assessment}
              onConfirm={handleConfirmImport}
              loading={loading}
            />
          )}

          {/* Stage 4: Validation Results */}
          {validationResult && !importStatus && (
            <ValidationResults
              result={validationResult}
              onConfirm={handleFinalImport}
              onCancel={() => {
                setValidationResult(null);
                setCurrentStage(3);
              }}
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

          {/* Loading state — always shown when loading */}
          {loading && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    {loadingStep?.label || 'Working…'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loadingStep?.detail || 'Please wait — do not close this tab.'}
                  </p>
                </div>
                {loadingStep?.total > 1 && (
                  <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                    Step {loadingStep.step}/{loadingStep.total}
                  </span>
                )}
              </div>
              {loadingStep?.total > 1 && (
                <div className="w-full bg-primary/10 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(loadingStep.step / loadingStep.total) * 100}%` }}
                  />
                </div>
              )}
              {/* Stage-specific hint */}
              {currentStage === 2 && (
                <div className="text-xs text-muted-foreground bg-white/60 rounded-lg px-3 py-2 border border-primary/10 space-y-1">
                  <p>📋 <strong>What's happening:</strong> AI is reading all {extractedText ? `the extracted content` : 'your file'} to identify columns, data types and which database entity best matches your data.</p>
                  <p>⏱ This step typically takes <strong>20–40 seconds</strong> for large files. Stage 3 (field mapping) will appear automatically when it's done.</p>
                </div>
              )}
              {currentStage === 4 && (
                <div className="text-xs text-muted-foreground bg-white/60 rounded-lg px-3 py-2 border border-primary/10">
                  <p>🔄 <strong>What's happening:</strong> AI is extracting every row and validating it against the database schema. Large files with 1000+ records can take 60–90 seconds.</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">⏳ Please keep this tab open — do not navigate away.</p>
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