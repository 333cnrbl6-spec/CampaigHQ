import { useState, useRef } from 'react';
import mammoth from 'mammoth';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, MapPin, Home, Layers } from 'lucide-react';

function FileDropZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.match(/\.docx?$/i));
    files.forEach(onFile);
  };

  const handleChange = (e) => {
    Array.from(e.target.files).forEach(onFile);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
    >
      <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
      <p className="font-semibold text-foreground">Drop legacy map files here</p>
      <p className="text-sm text-muted-foreground mt-1">or click to browse — accepts <strong>.docx</strong> files</p>
      <p className="text-xs text-muted-foreground mt-2">Expected filename format: <code className="bg-muted px-1.5 py-0.5 rounded">TYL5R6-130.docx</code></p>
      <input ref={inputRef} type="file" accept=".doc,.docx" multiple className="hidden" onChange={handleChange} />
    </div>
  );
}

function parseStreetsFromText(text) {
  const streets = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let inTable = false;

  for (const line of lines) {
    if (/road name|house number|households/i.test(line)) { inTable = true; continue; }
    if (inTable) {
      // Tab-separated or multi-space columns
      const cols = line.split(/\t{1,}|\s{2,}/).map(c => c.trim()).filter(Boolean);
      if (cols.length >= 1) {
        const streetName = cols[0];
        const houseRange = cols[1] || '';
        const numHH = parseInt(cols[2]) || 0;
        if (streetName.length > 2 && !/^\d+$/.test(streetName)) {
          streets.push({ street_name: streetName, house_range: houseRange, num_households: numHH });
        }
      }
    }
  }
  return streets;
}

const STATUS = {
  pending: { icon: FileText, color: 'text-muted-foreground', label: 'Queued' },
  uploading: { icon: Loader2, color: 'text-blue-500', label: 'Reading file...', spin: true },
  processing: { icon: Loader2, color: 'text-amber-500', label: 'Importing...', spin: true },
  done: { icon: CheckCircle2, color: 'text-green-600', label: 'Imported' },
  error: { icon: AlertCircle, color: 'text-destructive', label: 'Failed' },
};

export default function LegacyMapImport() {
  const [queue, setQueue] = useState([]); // { file, status, result, error }
  const [running, setRunning] = useState(false);
  const queryClient = useQueryClient();

  const addFiles = (file) => {
    setQueue(prev => {
      if (prev.some(q => q.file.name === file.name)) return prev;
      return [...prev, { file, status: 'pending', result: null, error: null, id: Math.random().toString(36).slice(2) }];
    });
  };

  const removeFile = (id) => setQueue(prev => prev.filter(q => q.id !== id));

  const updateItem = (id, patch) => setQueue(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));

  const processAll = async () => {
    setRunning(true);
    const pending = queue.filter(q => q.status === 'pending' || q.status === 'error');

    for (const item of pending) {
      try {
        // Step 1: Extract text from DOCX client-side using mammoth
        updateItem(item.id, { status: 'uploading' });
        const arrayBuffer = await item.file.arrayBuffer();
        const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });

        // Step 2: Parse streets from the extracted text
        updateItem(item.id, { status: 'processing' });
        const streets = parseStreetsFromText(rawText);

        // Step 3: Send parsed data to backend for entity creation
        const res = await base44.functions.invoke('parseLegacyMapFile', {
          filename: item.file.name,
          text_content: rawText,
          streets,
        });

        if (!res.data?.success) throw new Error(res.data?.error || 'Import failed');

        updateItem(item.id, { status: 'done', result: res.data });
      } catch (err) {
        updateItem(item.id, { status: 'error', error: err.message });
      }
    }

    // Invalidate relevant queries so they reload
    queryClient.invalidateQueries({ queryKey: ['turfs'] });
    queryClient.invalidateQueries({ queryKey: ['leaflet-runs'] });
    setRunning(false);
  };

  const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'error').length;
  const doneCount = queue.filter(q => q.status === 'done').length;

  return (
    <div className="p-6 lg:p-10 max-w-[860px] mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Legacy Map File Importer</h1>
        <p className="text-muted-foreground mt-1">
          Import Paul's existing turf and leaflet route files. Each <code className="bg-muted px-1 rounded text-xs">.docx</code> file 
          creates a <strong>Turf record</strong> and individual <strong>Leaflet Run</strong> entries for every street.
        </p>
      </div>

      {/* Legend */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-sm">How filename parsing works:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div className="bg-card rounded-lg p-3 border">
            <p className="font-mono text-xs text-primary mb-1">TYL<strong>5</strong>R6-130.docx</p>
            <p className="text-xs text-muted-foreground"><strong>TYL</strong> = Tyldesley area · <strong>5</strong> = Turf number</p>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <p className="font-mono text-xs text-primary mb-1">TYL5<strong>R6</strong>-130.docx</p>
            <p className="text-xs text-muted-foreground"><strong>R6</strong> = Leaflet route 6</p>
          </div>
          <div className="bg-card rounded-lg p-3 border">
            <p className="font-mono text-xs text-primary mb-1">TYL5R6-<strong>130</strong>.docx</p>
            <p className="text-xs text-muted-foreground"><strong>130</strong> = Target households</p>
          </div>
        </div>
      </div>

      <FileDropZone onFile={addFiles} />

      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{queue.length} file{queue.length !== 1 ? 's' : ''} queued</h2>
            {pendingCount > 0 && (
              <Button onClick={processAll} disabled={running} className="gap-2">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import All ({pendingCount})
              </Button>
            )}
            {doneCount === queue.length && doneCount > 0 && (
              <Badge className="bg-green-100 text-green-800 gap-1 px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All imported!
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {queue.map(item => {
              const st = STATUS[item.status] || STATUS.pending;
              const Icon = st.icon;
              return (
                <div key={item.id} className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${st.color} ${st.spin ? 'animate-spin' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{item.file.name}</p>
                        <Badge variant="outline" className="text-[10px]">{st.label}</Badge>
                      </div>

                      {item.result && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Turf: <strong className="text-foreground">{item.result.meta.turf_name} ({item.result.meta.route_label})</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Home className="w-3.5 h-3.5 text-primary" />
                            <span><strong className="text-foreground">{item.result.meta.total_households}</strong> households</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span><strong className="text-foreground">{item.result.streets_imported}</strong> streets imported</span>
                          </div>
                        </div>
                      )}

                      {item.error && (
                        <p className="text-xs text-destructive mt-1">{item.error}</p>
                      )}
                    </div>

                    {(item.status === 'pending' || item.status === 'error') && !running && (
                      <button onClick={() => removeFile(item.id)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {doneCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              <p className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Import complete</p>
              <p className="mt-0.5 text-green-700">
                Go to <strong>Turf Management</strong> to assign volunteers and set priorities, 
                or <strong>Leaflet Distribution</strong> to track delivery progress street by street.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}