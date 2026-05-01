import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i;

function extractPostcode(str) {
  if (!str) return null;
  const m = String(str).match(UK_POSTCODE_RE);
  return m ? m[1].toUpperCase().replace(/\s+/g, ' ').trim() : null;
}

function parseTurfZone(sheetName) {
  const match = sheetName.match(/^([A-Z0-9&*\s]+?)\s*[-–]/i);
  return match ? match[1].trim().replace(/\s+/g, '') : sheetName.trim();
}

function parseSheetPreview(sheet, sheetName, isPostal) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const turf = parseTurfZone(sheetName);
  let count = 0;
  for (const row of rows) {
    const raw = row[1];
    if (!raw) continue;
    const addr = String(raw).trim();
    if (!addr || addr.toUpperCase().startsWith('TYL') || addr.toUpperCase() === turf) continue;
    count++;
  }
  return { name: sheetName, turf, count, isPostal };
}

export default function VoterListImport() {
  const queryClient = useQueryClient();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [voterType, setVoterType] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(null); // 'uploading' | 'importing' | 'done' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const processFile = (f, isPostal) => {
    setFile(f);
    setPendingFile(null);
    setVoterType(isPostal ? 'postal' : 'registered');
    setPreview(null);
    setStatus(null);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheets = workbook.SheetNames.map((name) =>
        parseSheetPreview(workbook.Sheets[name], name, isPostal)
      );
      const total = sheets.reduce((s, sh) => s + sh.count, 0);
      setPreview({ sheets, total });
    };
    reader.readAsArrayBuffer(f);
  };

  const handleFile = (f) => {
    setPendingFile(f);
    setPreview(null);
    setStatus(null);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setError(null);

    // Step 1: upload file to storage
    setStatus('uploading');
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    const fileUrl = uploadRes.file_url;

    // Step 2: hand off to backend — we can navigate away now
    setStatus('importing');
    const response = await base44.functions.invoke('importVoterList', {
      file_url: fileUrl,
      file_name: file.name,
      is_postal: voterType === 'postal',
    });

    if (response.data?.error) {
      setError(response.data.error);
      setStatus('error');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    setResult(response.data);
    setStatus('done');
  };

  const reset = () => {
    setFile(null);
    setPendingFile(null);
    setVoterType(null);
    setPreview(null);
    setStatus(null);
    setError(null);
    setResult(null);
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Voter List Importer</h1>
        <p className="text-muted-foreground">
          Import the Tyldesley &amp; Mosley Common electoral register spreadsheet. Each address is imported as a Contact, tagged with its turf zone.
        </p>
      </div>

      {/* Drop zone */}
      {!file && !pendingFile && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-sm">Drop your XLSX file here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Voter type confirmation prompt */}
      {pendingFile && !file && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">{pendingFile.name}</p>
              <p className="text-xs text-muted-foreground">Please confirm what type of voters are in this file</p>
            </div>
            <button onClick={reset} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm font-medium">What type of voter list is this?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => processFile(pendingFile, true)}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-colors p-5 text-left"
            >
              <span className="text-2xl">📬</span>
              <span className="font-semibold text-sm text-blue-800">Postal Voters</span>
              <span className="text-xs text-blue-600 text-center">Marks contacts as registered voters with a "Postal Voter" tag</span>
            </button>
            <button
              onClick={() => processFile(pendingFile, false)}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-colors p-5 text-left"
            >
              <span className="text-2xl">🗳️</span>
              <span className="font-semibold text-sm text-primary">Registered (Non-Postal)</span>
              <span className="text-xs text-primary/70 text-center">Standard registered voters, tagged with their turf zone only</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview + import */}
      {file && preview && status !== 'done' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{preview.total.toLocaleString()} addresses across {preview.sheets.length} sheets</p>
              </div>
            </div>
            <button onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {preview.sheets.map((sh) => (
              <div key={sh.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-medium text-sm">{sh.name}</span>
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{sh.turf}</span>
                  {sh.isPostal && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Postal Voters</span>}
                </div>
                <span className="text-sm text-muted-foreground">{sh.count.toLocaleString()} addresses</span>
              </div>
            ))}
          </div>

          {(status === 'uploading' || status === 'importing') ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
              <p className="text-sm text-primary font-medium">
                {status === 'uploading'
                  ? 'Uploading file…'
                  : 'Importing contacts on the server — you can navigate away freely.'}
              </p>
            </div>
          ) : (
            <Button onClick={handleImport} className="w-full" size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Import {preview.total.toLocaleString()} Contacts
            </Button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-xl p-4 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Success */}
      {status === 'done' && result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <p className="font-semibold text-green-900 text-xl">Import Complete!</p>
          <p className="text-sm text-green-700">
            {result.imported?.toLocaleString()} contacts saved to the database, each tagged with their turf zone.
          </p>
          <Button onClick={reset} variant="outline" className="mt-4">Import Another File</Button>
        </div>
      )}
    </div>
  );
}