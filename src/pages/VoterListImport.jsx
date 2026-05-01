import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REASSURANCE_MESSAGES = [
  "Working through the list — this is completely normal for large files.",
  "Still going! Each batch of 200 contacts is sent one at a time.",
  "Hang in there — the database is accepting the records as fast as it can.",
  "More than halfway there! Keep this tab open and we'll get there.",
  "Almost done — the last batches are being written now.",
];

const BATCH_SIZE = 100;

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

function parseSheet(sheet, sheetName, isPostal = false) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const turf = parseTurfZone(sheetName);

  const addresses = [];
  for (const row of rows) {
    // Column index 1 (second column) is the address
    const raw = row[1];
    if (!raw) continue;
    const addr = String(raw).trim();
    // Skip if it looks like a header (same as turf code) or is empty
    if (!addr || addr.toUpperCase().startsWith('TYL') || addr.toUpperCase() === turf) continue;
    const tags = isPostal ? [turf, 'Postal Voter'] : [turf];
    addresses.push({ name: addr, address: addr, tags, registered_voter: isPostal });
  }
  return addresses;
}

export default function VoterListImport() {
  const queryClient = useQueryClient();
  const inputRef = useRef();
  const [file, setFile] = useState(null);
  const [voterType, setVoterType] = useState(null); // 'postal' | 'registered'
  const [pendingFile, setPendingFile] = useState(null); // file waiting for type confirmation
  const [preview, setPreview] = useState(null); // { sheets: [{name, count, turf}], total }
  const [status, setStatus] = useState(null); // 'importing' | 'done' | 'error'
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState(null);
  const [reassuranceIdx, setReassuranceIdx] = useState(0);

  useEffect(() => {
    if (status !== 'importing') return;
    const interval = setInterval(() => {
      setReassuranceIdx(i => (i + 1) % REASSURANCE_MESSAGES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [status]);

  const processFile = (f, isPostal) => {
    setFile(f);
    setPendingFile(null);
    setVoterType(isPostal ? 'postal' : 'registered');
    setPreview(null);
    setStatus(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const sheets = workbook.SheetNames.map((name) => {
        const records = parseSheet(workbook.Sheets[name], name, isPostal);
        return { name, turf: parseTurfZone(name), count: records.length, isPostal };
      });
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
      const isPostal = voterType === 'postal';
      let allRecords = [];
      for (const name of workbook.SheetNames) {
        allRecords = allRecords.concat(parseSheet(workbook.Sheets[name], name, isPostal));
      }

      setProgress({ done: 0, total: allRecords.length, currentBatch: 1, totalBatches: Math.ceil(allRecords.length / BATCH_SIZE) });

      // Import in batches with retry on rate limit
      const createdIds = [];
      const totalBatches = Math.ceil(allRecords.length / BATCH_SIZE);
      for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        setProgress(p => ({ ...p, currentBatch: batchNum, totalBatches }));
        const batch = allRecords.slice(i, i + BATCH_SIZE);

        // Retry up to 5 times on rate limit
        let created = null;
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            created = await base44.entities.Contact.bulkCreate(batch);
            break;
          } catch (err) {
            if (attempt === 5) throw err;
            // Wait longer on each retry
            await new Promise(r => setTimeout(r, attempt * 2000));
          }
        }

        createdIds.push(...(created || []).map(r => r.id));
        setProgress({ done: Math.min(i + BATCH_SIZE, allRecords.length), total: allRecords.length, currentBatch: batchNum, totalBatches });
        // Pause between batches
        if (i + BATCH_SIZE < allRecords.length) {
          await new Promise(r => setTimeout(r, 1000));
        }
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
    setPendingFile(null);
    setVoterType(null);
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
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    Saving batch {progress.currentBatch} of {progress.totalBatches}…
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {progress.done.toLocaleString()} of {progress.total.toLocaleString()} contacts saved
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary flex-shrink-0">
                  {progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: progress.total ? `${Math.max(5, (progress.done / progress.total) * 100)}%` : '5%' }}
                />
              </div>
              <div className="bg-white/70 border border-primary/10 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed transition-all duration-700">
                💬 <em>{REASSURANCE_MESSAGES[reassuranceIdx]}</em>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ⏳ Please keep this tab open — do not navigate away
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