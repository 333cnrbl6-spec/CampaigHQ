import React, { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SchemaValidator({ assessment, entityName, onConfirm, loading }) {
  const [expanded, setExpanded] = useState({});

  // Get entity schema from assessment's suggested entity
  const getEntitySchema = async () => {
    try {
      const base44 = await import('@/api/base44Client').then(m => m.base44);
      return await base44.entities[entityName]?.schema?.();
    } catch {
      return null;
    }
  };

  // Validate records against schema requirements
  const validateRecords = async (records) => {
    const schema = await getEntitySchema();
    if (!schema) return { valid: records, invalid: [] };

    const valid = [];
    const invalid = [];

    records.forEach((record, idx) => {
      const errors = [];

      // Check required fields
      if (schema.required) {
        schema.required.forEach(field => {
          if (!record[field] || (typeof record[field] === 'string' && record[field].trim() === '')) {
            errors.push(`Missing required field: ${field}`);
          }
        });
      }

      // Check data types
      Object.entries(schema.properties || {}).forEach(([field, fieldSchema]) => {
        if (!(field in record)) return;

        const value = record[field];
        const expectedType = fieldSchema.type;

        // Validate type
        if (expectedType === 'number' && isNaN(value)) {
          errors.push(`Field "${field}" must be a number, got "${value}"`);
        }
        if (expectedType === 'boolean' && !['true', 'false', true, false, 0, 1].includes(value)) {
          errors.push(`Field "${field}" must be true/false`);
        }
        if (expectedType === 'string' && typeof value !== 'string' && typeof value !== 'number') {
          errors.push(`Field "${field}" must be text`);
        }

        // Validate enum
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
          errors.push(`Field "${field}": "${value}" is not valid. Must be one of: ${fieldSchema.enum.join(', ')}`);
        }

        // Validate date format
        if (fieldSchema.format === 'date' && value && !/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
          errors.push(`Field "${field}" must be in date format (YYYY-MM-DD)`);
        }
      });

      if (errors.length > 0) {
        invalid.push({ recordIndex: idx, errors, record });
      } else {
        valid.push(record);
      }
    });

    return { valid, invalid };
  };

  const toggleExpand = (idx) => {
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Schema Validation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Records will be checked against the {entityName} entity schema for missing required fields and incorrect data formats.
        </p>
        <Button
          onClick={() => onConfirm(validateRecords)}
          disabled={loading || !assessment?.fields}
          className="w-full"
        >
          {loading ? 'Validating...' : 'Proceed with Validation'}
        </Button>
      </div>
    </div>
  );
}