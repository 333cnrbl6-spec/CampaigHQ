import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BATCH_SIZE = 200;

function parseTurfZone(sheetName) {
  // Extract turf code from sheet name e.g. "TYL 1 - 835" → "TYL1", "T&MC - 5818" → "T&MC"
  const match = sheetName.match(/^([A-Z0-9&*\s]+?)\s*[-–]/i);
  return match ? match[1].trim().replace(/\s+/g, '') : sheetName.trim();
}

function isPostalVoterSheet(sheetName) {
  // Only the first upload ("no header" file) contains postal voters.
  // All subsequent uploads are non-postal voters.
  return false;
}

function parseSheet(sheet, sheetName) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const turf = parseTurfZone(sheetName);
  const isPostal = isPostalVoterSheet(sheetName);

  const addresses = [];
  for (const row of rows) {
    // Column index 1 (second column) is the address
    const raw = row[1];
    if (!raw) continue;
    const addr = String(raw).trim();
    // Skip if it looks like a header (same as turf code) or is empty
    if (!addr || addr.toUpperCase().startsWith('TYL') || addr.toUpperCase() === turf) continue;
    const tags = isPostal ? [turf, 'Postal Voter'] : [turf];
    addresses.push({ address: addr, tags, registered_voter: isPostal });
  }
  return addresses;
}

export default function VoterListImport() {
  const queryClient = useQueryClient();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // { sheets: [{name, count, turf}], total }
  const [status, setStatus] = useState(null); // 'importing' | 'done' | 'error'
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    setFile(f);
    setPreview(null);
    setStatus(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheets = workbook.SheetNames.map((name) => {
        const records = parseSheet(workbook.Sheets[name], name);
        return { name, turf: parseTurfZone(name), count: records.length, isPostal: isPostalVoterSheet(name) };
      });
      const total = sheets.reduce((s, sh) => s + sh.count, 0);
      setPreview({ sheets, total });
    };
    reader.readAsArrayBuffer(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setStatus('importing');
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      let allRecords = [];
      for (const name of workbook.SheetNames) {
        allRecords = allRecords.concat(parseSheet(workbook.Sheets[name], name));
      }

      setProgress({ done: 0, total: allRecords.length, currentBatch: 1, totalBatches: Math.ceil(allRecords.length / BATCH_SIZE) });

      // Import in batches
      const createdIds = [];
      for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        setProgress(p => ({ ...p, currentBatch: batchNum }));
        const batch = allRecords.slice(i, i + BATCH_SIZE);
        const created = await base44.entities.Contact.bulkCreate(batch);
        createdIds.push(...(created || []).map(r => r.id));
        setProgress({ done: Math.min(i + BATCH_SIZE, allRecords.length), total: allRecords.length, currentBatch: batchNum, totalBatches: Math.ceil(allRecords.length / BATCH_SIZE) });
      }

      // Log the import
      await base44.entities.ImportLog.create({
        file_name: file.name,
        entity_type: 'Contact',
        record_count: createdIds.length,
        status: 'completed',
        created_record_ids: createdIds,
      });

      queryClient.invalidateQueries({ queryKey: ['contact'] });
      setStatus('done');
      setProgress({ done: createdIds.length, total: allRecords.length });
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setStatus('error');
    };
    reader.readAsArrayBuffer(file);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus(null);
    setError(null);
    setProgress({ done: 0, total: 0 });
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
      {!file && (
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

      {/* Preview */}
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

          {status === 'importing' ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    Saving batch {progress.currentBatch} of {progress.totalBatches}…
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {progress.done.toLocaleString()} of {progress.total.toLocaleString()} contacts saved — please keep this tab open
                  </p>
                </div>
              </div>
              <div className="w-full bg-primary/10 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: progress.total ? `${Math.max(5, (progress.done / progress.total) * 100)}%` : '5%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground italic text-center">
                ⏳ Large files can take 1–2 minutes — this is normal
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
      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <p className="font-semibold text-green-900 text-xl">Import Complete!</p>
          <p className="text-sm text-green-700">
            {progress.done.toLocaleString()} contacts saved to the database, each tagged with their turf zone.
          </p>
          <Button onClick={reset} variant="outline" className="mt-4">Import Another File</Button>
        </div>
      )}
    </div>
  );
}