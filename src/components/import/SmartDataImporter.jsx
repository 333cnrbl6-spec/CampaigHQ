import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import SmartDropZone from './SmartDropZone';

export default function SmartDataImporter({ entityName, onComplete, trigger }) {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // upload, classify, review, complete
  const [processing, setProcessing] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [schema, setSchema] = useState(null);
  const [proposedMapping, setProposedMapping] = useState({});
  const [userMapping, setUserMapping] = useState({});
  const [extractedData, setExtractedData] = useState([]);
  const [issues, setIssues] = useState([]);
  const [importedCount, setImportedCount] = useState(0);
  const [processingStep, setProcessingStep] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setStep('processing');
    setProcessing(true);

    try {
      // Step 1: Upload
      setProcessingStep({ step: 1, total: 3, label: 'Uploading your file…', detail: 'Sending to secure storage — may take a moment for larger files.' });
      const uploadRes = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const fileUrl = uploadRes.file_url;

      // Step 2: Get schema
      setProcessingStep({ step: 2, total: 3, label: 'Reading database structure…', detail: `Loading the ${entityName} schema so AI knows which fields to map to.` });
      const entitySchema = await base44.entities[entityName].schema();
      setSchema(entitySchema);

      // Step 3: AI analysis
      setProcessingStep({ step: 3, total: 3, label: 'AI is analysing your file…', detail: 'Detecting columns and proposing field mappings — usually 15–30 seconds.' });
      const analysisRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a data mapping assistant. Analyze this file and identify the data structure and fields present.
        
File URL: ${fileUrl}
Target entity schema fields: ${JSON.stringify(entitySchema.properties || {})}

Respond with a JSON object containing:
1. "detected_fields": array of field names detected in the source file
2. "field_mapping": object mapping detected fields to target schema fields (best guesses)
3. "file_preview": first 2-3 rows/records from the file as a readable summary
4. "confidence": overall confidence score (0-100) of the mapping

Example format:
{
  "detected_fields": ["Name", "Email", "Phone"],
  "field_mapping": {
    "Name": "name",
    "Email": "email",
    "Phone": "phone"
  },
  "file_preview": "Row 1: John Doe, john@example.com, 555-1234",
  "confidence": 85
}`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            detected_fields: { type: 'array', items: { type: 'string' } },
            field_mapping: { type: 'object', additionalProperties: { type: 'string' } },
            file_preview: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
      });

      const analysis = analysisRes;
      setFilePreview(analysis.file_preview);
      setProposedMapping(analysis.field_mapping || {});
      setUserMapping(analysis.field_mapping || {});
      setStep('classify');
    } catch (error) {
      setIssues([
        {
          type: 'error',
          issue: 'File analysis failed',
          value: error.message || 'Please check file format and try again',
        },
      ]);
      setStep('review');
    } finally {
      setProcessing(false);
      setProcessingStep(null);
    }
  }, [entityName]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) processFile(files[0]);
  };

  const handleExtractAndValidate = async () => {
    setProcessing(true);
    setProcessingStep({ step: 1, total: 2, label: 'Re-uploading and extracting records…', detail: 'AI is pulling every row out of your file using the confirmed field mapping.' });
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;
      setProcessingStep({ step: 2, total: 2, label: 'Validating against database schema…', detail: 'Checking data types, required fields and enums. Nearly done!' });

      // Extract with the confirmed mapping
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row_or_item: { type: ['string', 'number'] },
                  issue: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
          },
        },
      });

      if (extractRes.status === 'error') {
        throw new Error(extractRes.details || 'Failed to extract data');
      }

      const { records = [], issues: extractedIssues = [] } = extractRes.output || {};

      // Remap fields according to user's mapping, then validate
      const remappedRecords = records.map((record) => {
        const remapped = {};
        for (const [sourceField, targetField] of Object.entries(userMapping)) {
          if (record[sourceField] !== undefined && targetField && targetField !== '__skip__') {
            remapped[targetField] = record[sourceField];
          }
        }
        return remapped;
      });

      // Validate against schema
      const validated = remappedRecords.map((record, idx) => {
        const validated = {};
        const recordIssues = [];

        for (const [key, value] of Object.entries(record)) {
          if (schema.properties && schema.properties[key]) {
            validated[key] = value;
          } else if (!schema.properties || Object.keys(schema.properties).length === 0) {
            validated[key] = value;
          } else {
            recordIssues.push(`Unknown field: ${key}`);
          }
        }

        // Check required fields
        if (schema.required) {
          schema.required.forEach((req) => {
            if (!validated[req]) {
              recordIssues.push(`Missing required field: ${req}`);
            }
          });
        }

        return { record: validated, issues: recordIssues, index: idx + 1 };
      });

      // Separate valid from problematic
      const validRecords = validated.filter((v) => v.issues.length === 0).map((v) => v.record);
      const problematicRecords = validated.filter((v) => v.issues.length > 0);

      setExtractedData(validRecords);
      setIssues([
        ...extractedIssues.map((i) => ({ ...i, type: 'extraction' })),
        ...problematicRecords.flatMap((p) =>
          p.issues.map((issue) => ({
            type: 'validation',
            row_or_item: p.index,
            issue: issue,
            value: JSON.stringify(p.record),
          }))
        ),
      ]);

      setStep('review');
    } catch (error) {
      setIssues([
        {
          type: 'error',
          issue: 'Processing failed',
          value: error.message || 'Please try again',
        },
      ]);
      setStep('review');
    } finally {
      setProcessing(false);
      setProcessingStep(null);
    }
  };

  const handleImport = async () => {
    setProcessing(true);
    try {
      if (extractedData.length > 0) {
        await base44.entities[entityName].bulkCreate(extractedData);
        setImportedCount(extractedData.length);
      }
      setStep('complete');
      if (onComplete) onComplete(extractedData.length);
    } catch (error) {
      setIssues([
        {
          type: 'error',
          issue: 'Import failed',
          value: error.message || 'Please try again',
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setStep('upload');
    setFile(null);
    setFilePreview(null);
    setSchema(null);
    setProposedMapping({});
    setUserMapping({});
    setExtractedData([]);
    setIssues([]);
    setImportedCount(0);
  };

  const getSchemaFieldType = (fieldName) => {
    if (!schema?.properties?.[fieldName]) return 'string';
    const prop = schema.properties[fieldName];
    if (prop.enum) return `enum: ${prop.enum.join(', ')}`;
    return prop.type || 'string';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <trigger.type {...trigger.props} onClick={() => setOpen(true)} />}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Import {entityName} Data</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <SmartDropZone onFileSelected={processFile} processing={processing} />
        )}

        {step === 'processing' && (
          <div className="py-8 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">
                  {processingStep?.label || 'Working…'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {processingStep?.detail || 'Please wait, this may take up to 30 seconds.'}
                </p>
              </div>
              {processingStep && (
                <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
                  {processingStep.step}/{processingStep.total}
                </span>
              )}
            </div>
            {processingStep && (
              <div className="w-full bg-primary/10 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(processingStep.step / processingStep.total) * 100}%` }}
                />
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground italic">⏳ Please keep this window open — do not close it.</p>
          </div>
        )}

        {step === 'classify' && (
          <div className="space-y-4">
            {filePreview && (
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">File Preview:</p>
                <p className="text-xs text-foreground/70">{filePreview}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-3">Confirm Field Mapping</p>
              <p className="text-xs text-muted-foreground mb-3">
                AI has detected fields from your file. Map them to the target entity fields below.
              </p>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(proposedMapping).map(([sourceField, targetField]) => (
                  <div key={sourceField} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground/70">{sourceField}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">→</p>
                    <div className="flex-1">
                      <Select
                        value={userMapping[sourceField] || ''}
                        onValueChange={(value) =>
                          setUserMapping((prev) => ({
                            ...prev,
                            [sourceField]: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip__">Skip this field</SelectItem>
                          {schema?.properties &&
                            Object.entries(schema.properties).map(([fieldName]) => (
                              <SelectItem key={fieldName} value={fieldName}>
                                {fieldName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {getSchemaFieldType(userMapping[sourceField])}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {processing && processingStep && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary">{processingStep.label}</p>
                    <p className="text-xs text-muted-foreground">{processingStep.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{processingStep.step}/{processingStep.total}</span>
                </div>
                <div className="w-full bg-primary/10 rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full transition-all duration-500" style={{ width: `${(processingStep.step / processingStep.total) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleExtractAndValidate} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Working…
                  </>
                ) : (
                  'Extract & Validate'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {extractedData.length} valid records ready to import
                </span>
              </div>
              {issues.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {issues.length} issues found — set aside below
                </p>
              )}
            </div>

            {issues.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Issues Found</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                  {issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-white/60 rounded p-2 border border-amber-100 text-amber-900"
                    >
                      <p className="font-medium">
                        {issue.type === 'extraction' && 'Extraction Issue:'}
                        {issue.type === 'validation' && `Row ${issue.row_or_item}:`}
                        {issue.type === 'error' && 'Error:'} {issue.issue}
                      </p>
                      {issue.value && (
                        <p className="text-amber-700 mt-1 truncate opacity-70">{issue.value}</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-700 mt-3 italic">
                  These records have been set aside. You can review and manually import them later.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={extractedData.length === 0 || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Importing...
                  </>
                ) : (
                  `Import ${extractedData.length} Records`
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Import Complete</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {importedCount} {entityName.toLowerCase()} records imported successfully.
              {issues.length > 0 && ` ${issues.length} issues were set aside.`}
            </p>
            <Button onClick={closeDialog}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}