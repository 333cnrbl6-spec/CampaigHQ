import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function FieldMapper({ fileUrl, entityName, schema, onConfirm, loading }) {
  const [sampleData, setSampleData] = useState(null);
  const [sourceColumns, setSourceColumns] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (fileUrl && entityName) {
      extractSampleData();
    }
  }, [fileUrl, entityName]);

  const extractSampleData = async () => {
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract the first 2-3 rows/records from this file to show the data structure and column names. Return a JSON object with:
- "columns": array of column/field names found in the file
- "sample_rows": array of 2-3 sample rows showing data`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            columns: { type: 'array', items: { type: 'string' } },
            sample_rows: { type: 'array', items: { type: 'object', additionalProperties: true } },
          },
        },
      });

      setSourceColumns(res.columns || []);
      setSampleData(res.sample_rows || []);
      
      // Initialize mapping with best guesses
      const initialMapping = {};
      res.columns?.forEach(col => {
        const schemaFields = Object.keys(schema?.properties || {});
        const match = schemaFields.find(f => 
          f.toLowerCase().includes(col.toLowerCase()) || 
          col.toLowerCase().includes(f.toLowerCase())
        );
        if (match) {
          initialMapping[col] = match;
        }
      });
      setFieldMapping(initialMapping);
    } catch (error) {
      console.error('Failed to extract sample data:', error);
    }
  };

  const getSchemaFieldType = (fieldName) => {
    if (!schema?.properties?.[fieldName]) return 'string';
    const prop = schema.properties[fieldName];
    if (prop.enum) return `${prop.enum.join(' | ')}`;
    return prop.type || 'string';
  };

  const getRequiredFields = () => {
    return schema?.required || [];
  };

  const unmappedRequired = getRequiredFields().filter(f => !Object.values(fieldMapping).includes(f));

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <h3 className="font-semibold text-sm">Map file columns to {entityName} fields</h3>
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Match the columns in your file with the fields in our database
        </p>
      </div>

      {expanded && (
        <div className="space-y-4">
          {sampleData && (
            <div className="bg-white/50 rounded-lg p-3 border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Sample data preview:</p>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      {sourceColumns.map(col => (
                        <th key={col} className="text-left p-2 font-semibold text-foreground/70">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/30">
                        {sourceColumns.map(col => (
                          <td key={`${idx}-${col}`} className="p-2 text-foreground/60 truncate max-w-xs">
                            {String(row[col] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {sourceColumns.map(col => (
              <div key={col} className="flex items-start gap-3">
                <div className="flex-1 pt-2">
                  <p className="text-xs font-medium text-foreground/70">{col}</p>
                </div>
                <div className="text-xs text-muted-foreground">→</div>
                <div className="flex-1">
                  <Select
                    value={fieldMapping[col] || ''}
                    onValueChange={(value) =>
                      setFieldMapping(prev => ({
                        ...prev,
                        [col]: value || undefined,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Skip this column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>— Skip this column —</SelectItem>
                      {schema?.properties &&
                        Object.keys(schema.properties).map(fieldName => (
                          <SelectItem key={fieldName} value={fieldName}>
                            {fieldName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {fieldMapping[col] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getSchemaFieldType(fieldMapping[col])}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {unmappedRequired.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-amber-900">Missing required fields:</p>
                <p className="text-amber-700 mt-1">{unmappedRequired.join(', ')}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFieldMapping({});
                extractSampleData();
              }}
              size="sm"
            >
              Reset
            </Button>
            <Button
              onClick={() => onConfirm(fieldMapping)}
              disabled={loading || unmappedRequired.length > 0}
              size="sm"
            >
              {loading ? 'Importing...' : 'Confirm & Import'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}