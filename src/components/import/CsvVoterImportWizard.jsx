import React, { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Copy, MapPin, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

// ── Schema fields we can map to ──────────────────────────────────────────────
const CONTACT_FIELDS = [
  { key: 'name',            label: 'Full Name',        required: true  },
  { key: 'address',         label: 'Address',          required: false },
  { key: 'postcode',        label: 'Postcode',         required: false },
  { key: 'phone',           label: 'Phone',            required: false },
  { key: 'email',           label: 'Email',            required: false },
  { key: 'support_level',   label: 'Support Level',    required: false },
  { key: 'registered_voter',label: 'Registered Voter', required: false },
  { key: 'notes',           label: 'Notes',            required: false },
  { key: 'canvassed',       label: 'Canvassed',        required: false },
];

// ── CSV parser (handles quoted fields) ───────────────────────────────────────
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(parseRow);
  return { headers, rows };
}

// ── Auto-guess column mapping ─────────────────────────────────────────────────
function autoGuessMapping(headers) {
  const mapping = {};
  const patterns = {
    name:             /\b(full.?name|name|voter.?name|surname.*first|first.*last)\b/i,
    address:          /\b(address|street|road|house)\b/i,
    postcode:         /\b(postcode|post.?code|zip|postal)\b/i,
    phone:            /\b(phone|mobile|tel|contact.?no|number)\b/i,
    email:            /\b(email|e.?mail)\b/i,
    support_level:    /\b(support|level|affiliation|leaning|rating)\b/i,
    registered_voter: /\b(registered|reg|voter|electoral)\b/i,
    notes:            /\b(notes?|comments?|remarks?|additional)\b/i,
    canvassed:        /\b(canvassed|visited|contacted|knocked)\b/i,
  };
  headers.forEach(h => {
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(h) && !Object.values(mapping).includes(field)) {
        mapping[h] = field;
        break;
      }
    }
  });
  return mapping;
}

// ── Normalize a value into a Contact field ────────────────────────────────────
function normalizeValue(field, raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const s = String(raw).trim();
  if (field === 'registered_voter' || field === 'canvassed') {
    return /^(yes|true|1|y)$/i.test(s);
  }
  if (field === 'support_level') {
    const map = {
      'strong': 'strong_supporter', 'strongsupporter': 'strong_supporter',
      'strong supporter': 'strong_supporter', 'strong_supporter': 'strong_supporter',
      'leaning': 'leaning', 'lean': 'leaning',
      'undecided': 'undecided', 'unsure': 'undecided',
      'opposed': 'opposed', 'against': 'opposed',
    };
    return map[s.toLowerCase()] || 'unknown';
  }
  return s;
}

// ── Excel/CSV file → { headers, rows } ───────────────────────────────────────
function parseXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (data.length < 2) return { headers: [], rows: [] };
  const headers = data[0].map(String);
  const rows = data.slice(1).filter(r => r.some(cell => cell !== '')).map(r => r.map(String));
  return { headers, rows };
}

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = ['Upload File', 'Map Columns', 'Review & Fix', 'Import'];

export default function CsvVoterImportWizard({ onDone }) {
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});   // csvCol → contactField | '__skip'
  const [preview, setPreview] = useState([]);   // first 3 rows per col
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  // ── Step 0: File upload ─────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isXlsx = ext === 'xlsx' || ext === 'xls';
    const isCsv = ext === 'csv';
    if (!isXlsx && !isCsv) {
      setError('Please upload a CSV (.csv) or Excel (.xlsx / .xls) file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      let h, r;
      if (isXlsx) {
        ({ headers: h, rows: r } = parseXlsx(e.target.result));
      } else {
        ({ headers: h, rows: r } = parseCsv(e.target.result));
      }
      if (h.length === 0) { setError('Could not parse file — check the file format.'); return; }
      setFileName(file.name);
      setHeaders(h);
      setRows(r);
      // Build preview (first 3 data rows per col)
      const prev = {};
      h.forEach(col => {
        prev[col] = r.slice(0, 3).map(row => row[h.indexOf(col)] || '').filter(Boolean);
      });
      setPreview(prev);
      setMapping(autoGuessMapping(h));
      setStep(1);
    };
    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Step 1: Build mapped records & advance ──────────────────────────────────
  const buildRecords = () => {
    return rows.map(row => {
      const record = {};
      headers.forEach((col, idx) => {
        const field = mapping[col];
        if (!field || field === '__skip') return;
        const val = normalizeValue(field, row[idx]);
        if (val !== undefined) record[field] = val;
      });
      return record;
    }).filter(r => r.name); // must have at least a name
  };

  const handleProceedToReview = () => {
    const mapped = Object.values(mapping).filter(v => v && v !== '__skip');
    if (!mapped.includes('name')) { setError('You must map at least one column to "Full Name".'); return; }
    setError(null);
    setStep(2);
  };

  // ── Step 2: Computed review data ────────────────────────────────────────────
  const records = step >= 2 ? buildRecords() : [];

  const missingPostcodes = records.filter(r => !r.postcode?.trim());
  const duplicateGroups = (() => {
    const seen = {};
    records.forEach((r, i) => {
      const key = [r.name?.toLowerCase(), r.address?.toLowerCase()].filter(Boolean).join('||');
      if (!key) return;
      if (!seen[key]) seen[key] = [];
      seen[key].push(i);
    });
    return Object.values(seen).filter(g => g.length > 1);
  })();
  const duplicateIndices = new Set(duplicateGroups.flat());

  // ── Step 3: Final import ────────────────────────────────────────────────────
  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      // Deduplicate: keep only first of each duplicate group
      const keepIndices = new Set(records.map((_, i) => i));
      duplicateGroups.forEach(group => {
        // Remove all but the first
        group.slice(1).forEach(i => keepIndices.delete(i));
      });
      const toImport = records.filter((_, i) => keepIndices.has(i));

      const created = await base44.entities.Contact.bulkCreate(toImport);
      await base44.entities.ImportLog.create({
        file_name: fileName,
        entity_type: 'Contact',
        record_count: created.length,
        status: 'completed',
        created_record_ids: created.map(r => r.id),
      });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['import_logs'] });
      setImportResult({ imported: created.length, skippedDupes: duplicateGroups.reduce((s, g) => s + g.length - 1, 0), missingPostcodes: missingPostcodes.length });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {/* Header / stepper */}
      <div className="bg-primary/5 border-b px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">CSV Voter List Import</h3>
          {fileName && <span className="text-xs text-muted-foreground truncate max-w-xs">{fileName}</span>}
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-green-100 text-green-700' : 'text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 text-center">{i + 1}</span>}
                {label}
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-6">

        {/* ── Step 0: Upload ────────────────────────────────────────────────── */}
        {step === 0 && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-sm mb-1">Drop your voter list here</p>
            <p className="text-xs text-muted-foreground">or click to browse — .csv, .xlsx or .xls</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── Step 1: Map columns ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{rows.length} rows · {headers.length} columns detected. Map each column to a contact field.</p>
              <Badge variant="secondary" className="text-xs">{Object.values(mapping).filter(v => v && v !== '__skip').length} mapped</Badge>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {headers.map(col => (
                <div key={col} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{col}</p>
                    <p className="text-xs text-muted-foreground truncate">{(preview[col] || []).join(' · ') || 'no samples'}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Select
                    value={mapping[col] || '__skip'}
                    onValueChange={v => setMapping(m => ({ ...m, [col]: v }))}
                  >
                    <SelectTrigger className="w-44 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip">— Skip —</SelectItem>
                      {CONTACT_FIELDS.map(f => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}{f.required ? ' *' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(0)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button size="sm" className="flex-1" onClick={handleProceedToReview}>
                Review Data <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{records.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Records ready</div>
              </div>
              <div className={`rounded-lg p-3 text-center border ${missingPostcodes.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-muted border-border'}`}>
                <div className={`text-2xl font-bold ${missingPostcodes.length > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{missingPostcodes.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Missing postcodes</div>
              </div>
              <div className={`rounded-lg p-3 text-center border ${duplicateGroups.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-muted border-border'}`}>
                <div className={`text-2xl font-bold ${duplicateGroups.length > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>{duplicateGroups.reduce((s, g) => s + g.length - 1, 0)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Likely duplicates</div>
              </div>
            </div>

            {/* Duplicate warning */}
            {duplicateGroups.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-orange-800 font-semibold text-sm">
                  <Copy className="w-4 h-4" />
                  {duplicateGroups.length} potential duplicate group{duplicateGroups.length > 1 ? 's' : ''} detected
                </div>
                <p className="text-xs text-orange-700">Same name+address found in multiple rows. Only the first occurrence of each group will be imported.</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {duplicateGroups.slice(0, 10).map((group, gi) => (
                    <div key={gi} className="text-xs bg-white/60 rounded p-2 border border-orange-200">
                      <span className="font-medium text-orange-800">Rows {group.map(i => i + 1).join(', ')}: </span>
                      <span className="text-orange-700">{records[group[0]]?.name} — {records[group[0]]?.address || 'no address'}</span>
                    </div>
                  ))}
                  {duplicateGroups.length > 10 && <p className="text-xs text-orange-600 italic">…and {duplicateGroups.length - 10} more groups</p>}
                </div>
              </div>
            )}

            {/* Missing postcode warning */}
            {missingPostcodes.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <MapPin className="w-4 h-4" />
                  {missingPostcodes.length} record{missingPostcodes.length !== 1 ? 's' : ''} missing postcodes
                </div>
                <p className="text-xs text-amber-700">These contacts will import but cannot be geocoded or used in the Route Optimizer.</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {missingPostcodes.slice(0, 8).map((r, i) => (
                    <div key={i} className="text-xs bg-white/60 rounded px-2 py-1 border border-amber-200 flex items-center gap-2">
                      <span className="font-medium text-amber-800 truncate">{r.name}</span>
                      {r.address && <span className="text-amber-600 truncate">{r.address}</span>}
                    </div>
                  ))}
                  {missingPostcodes.length > 8 && <p className="text-xs text-amber-600 italic">…and {missingPostcodes.length - 8} more</p>}
                </div>
              </div>
            )}

            {/* Data preview table */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Data Preview (first 5 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">#</th>
                      {CONTACT_FIELDS.filter(f => Object.values(mapping).includes(f.key)).map(f => (
                        <th key={f.key} className="py-2 px-3 text-left font-medium text-muted-foreground">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 5).map((r, i) => (
                      <tr key={i} className={`border-t border-border/50 ${duplicateIndices.has(i) ? 'bg-orange-50' : !r.postcode ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                        {CONTACT_FIELDS.filter(f => Object.values(mapping).includes(f.key)).map(f => (
                          <td key={f.key} className="py-2 px-3 truncate max-w-[120px]">
                            {f.key === 'postcode' && !r.postcode ? <span className="text-amber-600 italic">missing</span> : String(r[f.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Remap
              </Button>
              <Button size="sm" className="flex-1" onClick={handleImport} disabled={importing || records.length === 0}>
                {importing ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Importing…</> : `Import ${records.length - duplicateGroups.reduce((s, g) => s + g.length - 1, 0)} Records`}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ──────────────────────────────────────────────────── */}
        {step === 3 && importResult && (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <p className="text-xl font-bold text-green-700">{importResult.imported} contacts imported</p>
              {importResult.skippedDupes > 0 && (
                <p className="text-sm text-muted-foreground mt-1">{importResult.skippedDupes} duplicate{importResult.skippedDupes !== 1 ? 's' : ''} skipped</p>
              )}
              {importResult.missingPostcodes > 0 && (
                <p className="text-sm text-amber-600 mt-1">{importResult.missingPostcodes} contacts imported without postcodes — run Geocode All to fill gaps</p>
              )}
            </div>
            <Button onClick={onDone} className="w-full">Done</Button>
          </div>
        )}

      </div>
    </div>
  );
}