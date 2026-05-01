import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Users, Shuffle, CheckCircle2, AlertCircle, Tag, Loader2, BarChart3 } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalisePostcode(pc) {
  return (pc || '').replace(/\s+/g, '').toUpperCase();
}

// Extract outward code (first part) for proximity grouping
function outwardCode(postcode) {
  const norm = normalisePostcode(postcode);
  const match = norm.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return match ? match[1] : norm.slice(0, 3) || 'UNKNOWN';
}

// Distribute contacts evenly across volunteers, grouping by proximity (postcode outward code)
function distributeContacts(contacts, volunteers, maxPerVolunteer) {
  if (!volunteers.length || !contacts.length) return {};

  // Group contacts by outward postcode
  const byPostcode = {};
  for (const c of contacts) {
    const key = outwardCode(c.postcode);
    if (!byPostcode[key]) byPostcode[key] = [];
    byPostcode[key].push(c);
  }

  // Sort groups by size descending (largest clusters first)
  const groups = Object.values(byPostcode).sort((a, b) => b.length - a.length);

  // Track assignment counts per volunteer
  const counts = Object.fromEntries(volunteers.map(v => [v.id, 0]));
  const assignments = Object.fromEntries(volunteers.map(v => [v.id, []]));

  for (const group of groups) {
    for (const contact of group) {
      // Pick the volunteer with the fewest assignments, respecting the cap
      const eligible = volunteers.filter(v => counts[v.id] < maxPerVolunteer);
      if (!eligible.length) break;
      eligible.sort((a, b) => counts[a.id] - counts[b.id]);
      const chosen = eligible[0];
      assignments[chosen.id].push(contact);
      counts[chosen.id]++;
    }
  }

  return assignments;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContactDistribution() {
  const queryClient = useQueryClient();

  const [turfFilter, setTurfFilter] = useState('all');
  const [maxPerVolunteer, setMaxPerVolunteer] = useState(50);
  const [preview, setPreview] = useState(null); // { [volunteerId]: Contact[] }
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Volunteers = contacts marked as volunteer
  const volunteers = useMemo(
    () => contacts.filter(c => c.volunteer && c.name),
    [contacts]
  );

  // Unallocated = contacts not marked volunteer, with no assigned tag containing their name
  // We use the `notes` field for assignment — or a dedicated tag like "Assigned: <name>"
  // Strategy: contacts whose tags do NOT include any "assigned:" prefix
  const allTurfs = useMemo(
    () => [...new Set(contacts.flatMap(c => c.tags || []))].filter(t => t && !t.startsWith('assigned:')).sort(),
    [contacts]
  );

  const unallocated = useMemo(() => {
    return contacts.filter(c => {
      if (c.volunteer) return false;
      const hasAssignment = (c.tags || []).some(t => t.startsWith('assigned:'));
      if (hasAssignment) return false;
      if (turfFilter !== 'all') return (c.tags || []).includes(turfFilter);
      return true;
    });
  }, [contacts, turfFilter]);

  const assigned = useMemo(() => {
    return contacts.filter(c => !c.volunteer && (c.tags || []).some(t => t.startsWith('assigned:')));
  }, [contacts]);

  const handleGeneratePreview = () => {
    setSaveResult(null);
    if (!volunteers.length) return;
    const distribution = distributeContacts(unallocated, volunteers, maxPerVolunteer);
    setPreview(distribution);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setSaveResult(null);
    let updated = 0;
    try {
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      for (const [volId, contactList] of Object.entries(preview)) {
        const vol = volunteers.find(v => v.id === volId);
        if (!vol) continue;
        const tag = `assigned:${vol.name}`;
        for (const contact of contactList) {
          const existingTags = (contact.tags || []).filter(t => !t.startsWith('assigned:'));
          await base44.entities.Contact.update(contact.id, { tags: [...existingTags, tag] });
          updated++;
          await delay(150);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSaveResult({ success: true, count: updated });
      setPreview(null);
    } catch (e) {
      setSaveResult({ success: false, error: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearAssignments = async () => {
    if (!confirm(`Remove all "assigned:" tags from ${assigned.length} contacts?`)) return;
    setSaving(true);
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    for (const c of assigned) {
      const cleaned = (c.tags || []).filter(t => !t.startsWith('assigned:'));
      await base44.entities.Contact.update(c.id, { tags: cleaned });
      await delay(150);
    }
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    setSaving(false);
    setSaveResult({ success: true, count: 0, cleared: true });
  };

  const loading = loadingContacts || loadingUsers;

  // Preview stats
  const previewStats = useMemo(() => {
    if (!preview) return null;
    const counts = Object.entries(preview).map(([volId, list]) => {
      const vol = volunteers.find(v => v.id === volId);
      return { name: vol?.name || volId, count: list.length };
    }).sort((a, b) => b.count - a.count);
    const total = counts.reduce((s, c) => s + c.count, 0);
    const avg = counts.length ? Math.round(total / counts.length) : 0;
    return { counts, total, avg };
  }, [preview, volunteers]);

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Auto-Distribute Contacts</h1>
        <p className="text-muted-foreground mt-1">
          Assign unallocated contacts to volunteers based on postcode proximity and even workload distribution.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Contacts', value: contacts.length, IconComp: Users, color: 'text-primary' },
          { label: 'Unallocated', value: unallocated.length, IconComp: AlertCircle, color: 'text-amber-500' },
          { label: 'Already Assigned', value: assigned.length, IconComp: CheckCircle2, color: 'text-green-600' },
          { label: 'Volunteers', value: volunteers.length, IconComp: Tag, color: 'text-blue-500' },
        ].map(({ label, value, IconComp, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
            <IconComp className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 mb-6 space-y-5">
        <h2 className="font-semibold text-base flex items-center gap-2"><Shuffle className="w-4 h-4 text-primary" /> Distribution Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Turf filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Turf Zone Filter</label>
            <Select value={turfFilter} onValueChange={setTurfFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All turfs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Turf Zones</SelectItem>
                {allTurfs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{unallocated.length} unallocated contacts in scope</p>
          </div>

          {/* Max contacts per volunteer */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Max contacts per volunteer: <span className="text-primary font-bold">{maxPerVolunteer}</span></label>
            <Slider
              min={10}
              max={200}
              step={5}
              value={[maxPerVolunteer]}
              onValueChange={([v]) => setMaxPerVolunteer(v)}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground">Contacts exceeding the cap are left unassigned</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            onClick={handleGeneratePreview}
            disabled={loading || !unallocated.length || !volunteers.length}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Generate Distribution Preview
          </Button>
          {assigned.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAssignments}
              disabled={saving}
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Clear All Assignments
            </Button>
          )}
        </div>

        {volunteers.length === 0 && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            No volunteers found. Mark contacts as "Volunteer" on the Contacts page first.
          </p>
        )}
      </div>

      {/* Save result */}
      {saveResult && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm flex items-center justify-between border ${saveResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span>
            {saveResult.cleared
              ? 'All assignment tags cleared.'
              : saveResult.success
              ? `Successfully assigned ${saveResult.count} contacts to volunteers.`
              : `Error: ${saveResult.error}`}
          </span>
          <button onClick={() => setSaveResult(null)} className="opacity-60 hover:opacity-100 ml-4">✕</button>
        </div>
      )}

      {/* Preview */}
      {previewStats && (
        <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-base">Distribution Preview</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {previewStats.total} contacts assigned across {previewStats.counts.length} volunteers (avg {previewStats.avg} each)
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Confirm & Save Assignments'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewStats.counts.map(({ name, count }) => {
              const pct = previewStats.total > 0 ? Math.round((count / previewStats.total) * 100) : 0;
              const vol = volunteers.find(v => v.name === name);
              const contactsForVol = preview[vol?.id] || [];
              const postcodes = [...new Set(contactsForVol.map(c => outwardCode(c.postcode)).filter(Boolean))];

              return (
                <div key={name} className="border border-border/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate">{name}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">{count}</span>
                  </div>

                  {/* Workload bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, (count / maxPerVolunteer) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}% of total · {count}/{maxPerVolunteer} cap</p>
                  </div>

                  {/* Postcode areas */}
                  {postcodes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {postcodes.slice(0, 6).map(pc => (
                        <Badge key={pc} variant="secondary" className="text-xs">{pc}</Badge>
                      ))}
                      {postcodes.length > 6 && (
                        <Badge variant="secondary" className="text-xs">+{postcodes.length - 6} more</Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}