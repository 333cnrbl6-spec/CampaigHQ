import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function DatabaseAssessment({ assessment, onConfirm, loading }) {
  const [expandedFields, setExpandedFields] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [fieldOverrides, setFieldOverrides] = useState({});

  const toggleField = (fieldName) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleFieldOverride = (fieldName, newName, newType) => {
    setFieldOverrides(prev => ({
      ...prev,
      [fieldName]: { name: newName, type: newType }
    }));
    setEditingField(null);
  };

  const getFieldConfig = (field) => {
    return fieldOverrides[field.name] || { name: field.name, type: field.type };
  };

  if (!assessment) return null;

  return (
    <div className="space-y-6 bg-white rounded-xl border border-border p-6">
      {/* Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Data Structure Assessment</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold text-primary">{assessment.recordCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Fields Detected</p>
            <p className="text-2xl font-bold text-primary">{assessment.fields.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="text-2xl font-bold text-primary">{assessment.confidence}%</p>
          </div>
        </div>
      </div>

      {/* Assessment explanation */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <p className="text-sm text-foreground">{assessment.explanation}</p>
      </div>

      {/* Field Mapping */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Detected Fields</h4>
        <div className="space-y-2">
          {assessment.fields.map((field) => {
            const config = getFieldConfig(field);
            const isExpanded = expandedFields[field.name];
            const isEditing = editingField === field.name;

            return (
              <div key={field.name} className="border border-border rounded-lg">
                <button
                  onClick={() => toggleField(field.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-sm">{config.name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {config.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {field.samples.length} samples
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Sample Values</p>
                      <div className="bg-white rounded p-3 text-xs space-y-1 max-h-32 overflow-auto">
                        {field.samples.map((sample, i) => (
                          <div key={i} className="text-slate-600">
                            • {String(sample).substring(0, 60)}
                            {String(sample).length > 60 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Data Quality</p>
                      <div className="text-xs space-y-1">
                        <div>Filled: {field.filledPercentage}%</div>
                        <div className="w-full bg-slate-200 rounded h-2">
                          <div
                            className="bg-green-600 h-2 rounded"
                            style={{ width: `${field.filledPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingField(field.name)}
                        className="w-full"
                      >
                        <Edit2 className="w-3 h-3 mr-2" />
                        Edit Field Name/Type
                      </Button>
                    )}

                    {isEditing && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Field name"
                          defaultValue={config.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            handleFieldOverride(field.name, newName, config.type);
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingField(null)}
                            className="w-full"
                          >
                            <Check className="w-3 h-3 mr-2" />
                            Done
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingField(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          Start Over
        </Button>
        <Button
          onClick={() => onConfirm(fieldOverrides)}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Importing...' : 'Confirm & Import'}
        </Button>
      </div>
    </div>
  );
}