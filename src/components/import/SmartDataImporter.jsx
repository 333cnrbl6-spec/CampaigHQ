import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPPORTED_FORMATS = ['.csv', '.xlsx', '.json', '.pdf', '.png', '.jpg', '.jpeg'];

export default function SmartDataImporter({ entityName, onComplete, trigger }) {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // upload, processing, review, complete
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [issues, setIssues] = useState([]);
  const [importedCount, setImportedCount] = useState(0);

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

    const isImage = /\.(jpg|jpeg|png)$/i.test(selectedFile.name);
    const isCsv = /\.csv$/i.test(selectedFile.name);
    const isJson = /\.json$/i.test(selectedFile.name);

    try {
      // Upload file to get URL
      const uploadRes = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const fileUrl = uploadRes.file_url;

      // Get schema for the entity
      const schema = await base44.entities[entityName].schema();

      // Extract data using AI with the entity schema
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

      // Validate and cross-check records with schema
      const validated = records.map((record, idx) => {
        const validated = {};
        const recordIssues = [];

        for (const [key, value] of Object.entries(record)) {
          if (schema.properties && schema.properties[key]) {
            validated[key] = value;
          } else if (!schema.properties || Object.keys(schema.properties).length === 0) {
            // If schema has no specific properties, accept all fields
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

      // Separate valid records from problematic ones
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
          issue: error.message || 'Processing failed',
          value: 'Please check file format and try again',
        },
      ]);
      setStep('review');
    } finally {
      setProcessing(false);
    }
  }, [entityName]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) processFile(files[0]);
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
    setExtractedData([]);
    setIssues([]);
    setImportedCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <trigger.type {...trigger.props} onClick={() => setOpen(true)} />}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Import {entityName} Data</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
            )}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Drag files here or click to select</p>
            <p className="text-xs text-muted-foreground mb-4">
              Supports CSV, Excel, JSON, PDF, Images
            </p>
            <input
              type="file"
              accept={SUPPORTED_FORMATS.join(',')}
              onChange={(e) => processFile(e.target.files?.[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" asChild>
              <Button variant="outline" className="cursor-pointer">
                Select File
              </Button>
            </label>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Analyzing your file...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Extracting and validating data with AI
            </p>
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
                  These records have been set aside. You can review and manually import them
                  later.
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