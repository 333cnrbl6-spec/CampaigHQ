import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Repeat2, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartDropZone from '@/components/import/SmartDropZone';
import ImportProgress from '@/components/import/ImportProgress';
import DatabaseAssessment from '@/components/import/DatabaseAssessment';
import RecentImports from '@/components/import/RecentImports';
import ValidationResults from '@/components/import/ValidationResults';

const isLegacyMapFile = (filename) => /\.docx?$/i.test(filename);

const INITIAL_STATE = {
  currentStage: 0,
  completedStages: [],
  currentFile: null,
  fileUrl: null,
  extractedText: null,
  assessment: null,
  extractedRecords: null,
  validationResult: null,
  error: null,
  importStatus: null,
  loading: false,
  loadingStep: null,
};

export default function DataImport() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [legacyFileDetected, setLegacyFileDetected] = useState(null);
  const hasAutoLoaded = useRef(false);

  const { data: lastImportLog } = useQuery({
    queryKey: ['import_logs'],
    queryFn: () => base44.entities.ImportLog.list('-created_date', 1),
    initialData: [],
  });

  const [state, setState] = useState(INITIAL_STATE);

  const update = (patch) => setState(prev => ({ ...prev, ...patch }));

  const markStageComplete = (stage) =>
    setState(prev => ({ ...prev, completedStages: [...new Set([...prev.completedStages, stage])] }));

  const resetAll = () => {
    setState(INITIAL_STATE);
    hasAutoLoaded.current = false;
  };

  // ─── Stage 2: AI Structure Analysis ─────────────────────────────────────────
  const runStructureAnalysis = async (url) => {
    if (!url) return;
    update({
      currentStage: 2,
      loading: true,
      error: null,
      loadingStep: {
        step: 1, total: 1,
        label: 'AI is analysing your data structure…',
        detail: 'Working out fields, data types and record counts. This usually takes 20–40 seconds — hang tight.',
      },
    });

    try {
      const analysisRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this dataset and provide a comprehensive assessment:
1. What does this data represent?
2. What are the main fields/columns?
3. What is the data type of each field (string, number, date, boolean, etc)?
4. What percentage of each field is filled (data quality)?
5. What entity type from this list would best represent this data: Contact, LeafletRun, Turf, Issue, Task, CanvassingLog?

Return JSON with:
- recordCount (number of rows)
- fields (array of {name, type, samples, filledPercentage})
- explanation (what the data represents)
- suggestedEntity (best matching entity from the list above)
- confidence (0-100)`,
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
        markStageComplete(2);
        update({ assessment: analysisRes, currentStage: 3, loading: false, loadingStep: null });
      } else {
        update({ error: 'AI could not analyse the data structure. Please try again.', loading: false, loadingStep: null });
      }
    } catch (err) {
      update({ error: err.message || 'Failed to analyse file', loading: false, loadingStep: null });
    }
  };

  // ─── Stage 1: Upload & Extract ───────────────────────────────────────────────
  const handleFileSelected = async (file) => {
    if (isLegacyMapFile(file.name)) {
      setLegacyFileDetected(file.name);
      return;
    }

    setState({
      ...INITIAL_STATE,
      currentStage: 1,
      currentFile: file,
      loading: true,
      loadingStep: { step: 1, total: 2, label: 'Uploading your file…', detail: 'Sending to secure storage — may take a moment for large files.' },
    });

    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const uploadedUrl = uploadRes.file_url;

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isStructuredFile = ['xlsx', 'xls', 'csv'].includes(ext);

      if (isStructuredFile) {
        // For spreadsheet files, skip text extraction and go straight to AI analysis
        markStageComplete(1);
        update({ extractedText: '(spreadsheet)', fileUrl: uploadedUrl, loading: false, loadingStep: null });
        await runStructureAnalysis(uploadedUrl);
      } else {
        update({ fileUrl: uploadedUrl, loadingStep: { step: 2, total: 2, label: 'Reading and extracting content…', detail: 'AI is scanning your file to pull out all text and data — please keep this tab open.' } });

        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: uploadedUrl,
          json_schema: {
            type: 'object',
            properties: { content: { type: 'string', description: 'All text and content from the file' } },
          },
        });

        if (extractRes.status === 'success' && extractRes.output?.content) {
          markStageComplete(1);
          update({ extractedText: extractRes.output.content, loading: false, loadingStep: null });
          await runStructureAnalysis(uploadedUrl);
        } else {
          update({ error: extractRes.details || 'Failed to extract document content', loading: false, loadingStep: null });
        }
      }
    } catch (err) {
      update({ error: err.message || 'Failed to upload and extract file', loading: false, loadingStep: null });
    }
  };

  // ─── Load last import ────────────────────────────────────────────────────────
  const handleLoadLastImport = async () => {
    const log = lastImportLog?.[0];
    if (!log?.file_url) return;

    hasAutoLoaded.current = true;
    update({
      currentFile: { name: log.file_name },
      fileUrl: log.file_url,
      currentStage: 1,
      loading: true,
      error: null,
      loadingStep: { step: 1, total: 1, label: 'Re-reading previously imported file…', detail: 'Extracting content from your last import to resume where you left off.' },
    });

    try {
      const ext = log.file_name?.split('.').pop()?.toLowerCase() || '';
      const isStructuredFile = ['xlsx', 'xls', 'csv'].includes(ext);

      if (isStructuredFile) {
        markStageComplete(1);
        update({ extractedText: '(spreadsheet)', loading: false, loadingStep: null });
        await runStructureAnalysis(log.file_url);
      } else {
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: log.file_url,
          json_schema: {
            type: 'object',
            properties: { content: { type: 'string', description: 'All text and content from the file' } },
          },
        });

        if (extractRes.status === 'success' && extractRes.output?.content) {
          markStageComplete(1);
          update({ extractedText: extractRes.output.content, loading: false, loadingStep: null });
          await runStructureAnalysis(log.file_url);
        } else {
          update({ error: 'Could not re-extract file content. Please re-upload the file.', loading: false, loadingStep: null });
        }
      }
    } catch (err) {
      update({ error: err.message || 'Failed to load last file', loading: false, loadingStep: null });
    }
  };

  // ─── Stage 4: Extract & Validate Records ────────────────────────────────────
  const handleConfirmImport = async (fieldOverrides) => {
    if (!state.fileUrl || !state.assessment) return;

    update({
      currentStage: 4,
      loading: true,
      error: null,
      loadingStep: { step: 1, total: 2, label: 'Extracting all records from your file…', detail: 'AI is reading every row and mapping it to the correct fields. Large files can take up to a minute.' },
    });

    try {
      const fieldMapping = (state.assessment.fields || []).reduce((acc, field) => {
        const override = fieldOverrides?.[field.name];
        acc[field.name] = override?.name || field.name;
        return acc;
      }, {});

      const mappingInstructions = Object.entries(fieldMapping)
        .map(([src, tgt]) => `"${src}" → "${tgt}"`)
        .join(', ');

      const extractRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract all records from this file using this field mapping: ${mappingInstructions}.
Map each source column to its corresponding target field. Return ALL records as an array of JSON objects, including incomplete or invalid ones for validation review.`,
        file_urls: [state.fileUrl],
        response_json_schema: {
          type: 'object',
          properties: { records: { type: 'array', items: { type: 'object' } } },
        },
      });

      const records = extractRes?.records || [];

      if (records.length === 0) {
        update({ error: 'No records could be extracted from the file', loading: false, loadingStep: null });
        return;
      }

      update({
        extractedRecords: records,
        loadingStep: { step: 2, total: 2, label: 'Validating records…', detail: `Checking all ${records.length} records against the database schema.` },
      });

      const VALID_ENTITIES = ['Contact', 'LeafletRun', 'Turf', 'Issue', 'Task', 'CanvassingLog'];
      const rawSuggested = state.assessment.suggestedEntity || 'Contact';
      const entityName = VALID_ENTITIES.includes(rawSuggested) ? rawSuggested : 'Contact';
      const entitySchema = await base44.entities[entityName].schema();

      const validationErrors = [];
      const validRecords = [];

      records.forEach((record, idx) => {
        const recordErrors = [];

        (entitySchema.required || []).forEach(field => {
          const val = record[field];
          if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
            recordErrors.push(`Missing required field: ${field}`);
          }
        });

        Object.entries(entitySchema.properties || {}).forEach(([field, fieldSchema]) => {
          if (!(field in record)) return;
          const value = record[field];
          if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
            recordErrors.push(`"${field}" value "${value}" must be one of: ${fieldSchema.enum.join(', ')}`);
          }
          if (fieldSchema.type === 'number' && value !== null && value !== undefined && isNaN(Number(value))) {
            recordErrors.push(`"${field}": "${value}" is not a valid number`);
          }
          if (fieldSchema.format === 'date' && value && !/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
            recordErrors.push(`"${field}": date must be YYYY-MM-DD format`);
          }
        });

        if (recordErrors.length > 0) {
          validationErrors.push({ recordIndex: idx + 1, errors: recordErrors, record });
        } else {
          validRecords.push(record);
        }
      });

      markStageComplete(4);
      update({
        validationResult: { total: records.length, valid: validRecords.length, validRecords, invalid: validationErrors, entityName },
        loading: false,
        loadingStep: null,
      });
    } catch (err) {
      update({ error: err.message || 'Failed to extract and validate records', loading: false, loadingStep: null });
    }
  };

  // ─── Stage 5: Final Import ───────────────────────────────────────────────────
  const handleFinalImport = async () => {
    const { validationResult, currentFile, fileUrl } = state;
    if (!validationResult?.validRecords?.length) {
      update({ error: 'No valid records to import' });
      return;
    }

    update({ loading: true, error: null, loadingStep: { step: 1, total: 1, label: 'Saving records to database…', detail: `Writing ${validationResult.validRecords.length} records. Nearly there!` } });

    try {
      const createdRecords = await base44.entities[validationResult.entityName].bulkCreate(validationResult.validRecords);
      const recordIds = (createdRecords || []).map(r => r.id);

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

      update({ importStatus: { count: recordIds.length, entity: validationResult.entityName }, loading: false, loadingStep: null });

      setTimeout(() => resetAll(), 5000);
    } catch (err) {
      update({ error: err.message || 'Import failed', loading: false, loadingStep: null });
    }
  };

  const { currentStage, completedStages, currentFile, extractedText, assessment, validationResult, importStatus, error, loading, loadingStep } = state;

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Smart Data Import</h1>
        <p className="text-muted-foreground">Upload any file and AI will automatically detect, map and import your data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Progress sidebar */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border p-6 h-fit sticky top-6">
          <h3 className="font-semibold mb-4">Import Progress</h3>
          <ImportProgress currentStage={currentStage} completedStages={completedStages} />
          {currentStage > 0 && !loading && (
            <Button variant="ghost" size="sm" className="w-full mt-4 text-muted-foreground" onClick={resetAll}>
              Start over
            </Button>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Stage 0: Upload */}
          {currentStage === 0 && (
            <div className="space-y-4">
              {legacyFileDetected && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 text-sm">Legacy map file detected</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      <strong>{legacyFileDetected}</strong> is a legacy DOCX map file. Use the dedicated importer instead.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/legacy-import')} className="gap-1.5 flex-shrink-0">
                    Open Importer <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <SmartDropZone onFileSelected={handleFileSelected} processing={loading} />
              {lastImportLog?.[0]?.file_url && (
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Last imported file</p>
                    <p className="text-xs text-muted-foreground mt-1">{lastImportLog[0].file_name}</p>
                  </div>
                  <Button onClick={handleLoadLastImport} disabled={loading} variant="outline" size="sm">
                    <Repeat2 className="w-4 h-4 mr-2" />
                    Load & Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Stage 1 → 2 transition: extraction done, AI analysis starting */}
          {currentStage === 2 && extractedText && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Stage 1 complete — file extracted</p>
                <p className="text-xs text-green-700 mt-0.5">AI is now analysing the structure. Stage 3 (field mapping) will appear automatically when done.</p>
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
              onCancel={() => update({ validationResult: null, currentStage: 3 })}
              loading={loading}
            />
          )}

          {/* Success */}
          {importStatus && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <p className="font-semibold text-green-900 text-lg">Import Successful</p>
              <p className="text-sm text-green-700">
                {importStatus.count} {importStatus.entity} record{importStatus.count !== 1 ? 's' : ''} saved to the database.
              </p>
              <p className="text-xs text-green-600 mt-2">Resetting in a moment…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/5 rounded-xl p-4 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* Loading panel — always visible when processing */}
          {loading && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">{loadingStep?.label || 'Working…'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{loadingStep?.detail || 'Please wait.'}</p>
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
              {currentStage === 2 && (
                <div className="text-xs text-muted-foreground bg-white/60 rounded-lg px-3 py-2 border border-primary/10">
                  <strong>What's happening:</strong> AI is reading the extracted content to identify columns, data types, and which database table best matches your data. Stage 3 will appear automatically when done.
                </div>
              )}
              {currentStage === 4 && (
                <div className="text-xs text-muted-foreground bg-white/60 rounded-lg px-3 py-2 border border-primary/10">
                  <strong>What's happening:</strong> AI is extracting every row and validating against the schema. Files with 1000+ records can take 60–90 seconds.
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">⏳ Keep this tab open — do not navigate away.</p>
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