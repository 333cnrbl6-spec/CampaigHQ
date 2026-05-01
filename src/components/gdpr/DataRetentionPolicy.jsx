import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { addDays, isBefore, format } from 'date-fns';

const RETENTION_OPTIONS = [
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
  { value: '730', label: '2 years' },
  { value: '1825', label: '5 years' },
];

const CONFIG_KEYS = {
  enabled: 'gdpr_retention_enabled',
  days: 'gdpr_retention_days',
  last_run: 'gdpr_retention_last_run',
};

export default function DataRetentionPolicy() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const { data: configs = [] } = useQuery({
    queryKey: ['system_config_gdpr'],
    queryFn: () => base44.entities.SystemConfig.list(),
  });

  const getConfig = (key) => configs.find(c => c.key === key)?.value;

  const retentionEnabled = getConfig(CONFIG_KEYS.enabled) === 'true';
  const retentionDays = getConfig(CONFIG_KEYS.days) || '365';
  const lastRun = getConfig(CONFIG_KEYS.last_run);

  const upsertConfig = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = configs.find(c => c.key === key);
      if (existing) {
        await base44.entities.SystemConfig.update(existing.id, { value });
      } else {
        await base44.entities.SystemConfig.create({ key, value });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system_config_gdpr'] }),
  });

  const toggleRetention = (val) => {
    upsertConfig.mutate({ key: CONFIG_KEYS.enabled, value: String(val) });
  };

  const setDays = (val) => {
    upsertConfig.mutate({ key: CONFIG_KEYS.days, value: val });
  };

  const runRetentionSweep = async () => {
    setRunning(true);
    setRunResult(null);
    const contacts = await base44.entities.Contact.list('-created_date', 2000);
    const cutoff = addDays(new Date(), -parseInt(retentionDays));
    const toFlag = contacts.filter(c => {
      if (c.data_retention_exempt) return false;
      if (c.deletion_requested) return false;
      const created = new Date(c.created_date);
      return isBefore(created, cutoff);
    });

    let flagged = 0;
    for (const c of toFlag) {
      await base44.entities.Contact.update(c.id, {
        deletion_requested: true,
        deletion_requested_date: new Date().toISOString().split('T')[0],
      });
      await base44.entities.GdprRequest.create({
        request_type: 'right_to_be_forgotten',
        contact_id: c.id,
        contact_name: c.name,
        contact_email: c.email || '',
        status: 'pending',
        notes: `Auto-flagged by data retention policy (${retentionDays} days)`,
      });
      flagged++;
    }

    await upsertConfig.mutateAsync({
      key: CONFIG_KEYS.last_run,
      value: new Date().toISOString(),
    });

    setRunResult({ flagged, checked: toFlag.length, total: contacts.length });
    setRunning(false);
    qc.invalidateQueries({ queryKey: ['contacts_gdpr'] });
    qc.invalidateQueries({ queryKey: ['contacts_deletion'] });
    qc.invalidateQueries({ queryKey: ['gdpr_requests'] });
  };

  return (
    <div className="space-y-6">
      {/* Policy toggle */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">Automatic Data Retention Policy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically flag voter contact records for deletion after a set period. Records are queued for review — no automatic deletion occurs without manual confirmation.
            </p>
          </div>
          <Switch
            checked={retentionEnabled}
            onCheckedChange={toggleRetention}
            disabled={upsertConfig.isPending}
          />
        </div>

        {retentionEnabled && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium w-48">Retention period</Label>
              <Select value={retentionDays} onValueChange={setDays}>
                <SelectTrigger className="w-44">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
              <p className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> How this works</p>
              <ul className="list-disc ml-5 text-xs space-y-1 text-blue-700">
                <li>Records older than {RETENTION_OPTIONS.find(o => o.value === retentionDays)?.label} are flagged for deletion</li>
                <li>Records marked as <strong>Retention Exempt</strong> are never auto-flagged</li>
                <li>Flagged records appear in the Right to Be Forgotten queue for manual review</li>
                <li>No data is deleted automatically — a human must confirm each deletion</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                {lastRun
                  ? <>Last sweep: {format(new Date(lastRun), 'dd MMM yyyy HH:mm')}</>
                  : 'No sweep run yet'}
              </div>
              <Button
                onClick={runRetentionSweep}
                disabled={running || upsertConfig.isPending}
                variant="outline"
                className="gap-2"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Run Retention Sweep Now
              </Button>
            </div>

            {runResult && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold">Sweep complete</p>
                  <p className="text-xs mt-1">
                    Checked {runResult.total} contacts · <strong>{runResult.flagged} flagged</strong> for deletion review
                    {runResult.flagged === 0 && ' — all records are within the retention period'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exemptions info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-sm">Retention Exemptions</h3>
        <p className="text-sm text-muted-foreground">
          Individual contacts can be marked as <strong>Retention Exempt</strong> — useful for key volunteers, elected officials, or anyone whose data must be retained for legitimate campaign purposes.
          Edit a contact record directly to toggle their exemption status.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Always ensure your data retention practices comply with the ICO guidelines and your party's data protection policy. This tool flags records for human review — it does not make legal compliance decisions for you.
          </p>
        </div>
      </div>
    </div>
  );
}