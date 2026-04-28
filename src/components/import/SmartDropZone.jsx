import React, { useState } from 'react';
import { Upload, FileText, FileJson, Image, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (/^csv$/.test(ext)) return { icon: FileText, label: 'CSV', color: 'text-blue-600' };
  if (/^xlsx?$/.test(ext)) return { icon: FileText, label: 'Excel', color: 'text-green-600' };
  if (/^json$/.test(ext)) return { icon: FileJson, label: 'JSON', color: 'text-amber-600' };
  if (/^pdf$/.test(ext)) return { icon: FileText, label: 'PDF', color: 'text-red-600' };
  if (/^(png|jpg|jpeg|gif|webp|svg)$/.test(ext)) return { icon: Image, label: ext.toUpperCase(), color: 'text-purple-600' };
  if (/^(txt|doc|docx|md)$/.test(ext)) return { icon: FileText, label: ext.toUpperCase(), color: 'text-slate-600' };
  return { icon: FileText, label: ext.toUpperCase() || 'File', color: 'text-gray-600' };
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function SmartDropZone({ onFileSelected, processing = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [hoveredFile, setHoveredFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setHoveredFile(files[0]);
      setTimeout(() => {
        onFileSelected(files[0]);
        setHoveredFile(null);
      }, 500);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setHoveredFile(file);
      setTimeout(() => {
        onFileSelected(file);
        setHoveredFile(null);
      }, 500);
    }
  };

  const fileInfo = hoveredFile ? getFileIcon(hoveredFile.name) : null;

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300',
        dragActive ? 'border-primary bg-primary/10 shadow-lg scale-105' : 'border-border bg-muted/30 hover:bg-muted/50'
      )}
    >
      {processing ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Processing file...</p>
        </div>
      ) : hoveredFile ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            {fileInfo && (
              <>
                <div className={cn('w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-md', fileInfo.color)}>
                  <fileInfo.icon className="w-6 h-6" />
                </div>
                <CheckCircle className="w-5 h-5 text-primary absolute -bottom-1 -right-1 bg-white rounded-full" />
              </>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{hoveredFile.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fileInfo?.label} • {formatFileSize(hoveredFile.size)}
            </p>
          </div>
          <p className="text-xs text-primary font-medium">Ready to import...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Drop your file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          </div>
          <p className="text-xs text-muted-foreground">
            All file types supported
          </p>
        </div>
      )}

      <input
        type="file"
        onChange={handleFileInput}
        className="hidden"
        id="smart-file-input"
        disabled={processing}
      />
      <label htmlFor="smart-file-input" className="cursor-pointer block mt-4">
        <div className="inline-block px-6 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
          Select File
        </div>
      </label>
    </div>
  );
}