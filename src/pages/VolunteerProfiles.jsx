import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  User, Phone, ShieldAlert, MapPin, CheckCircle2, Search,
  AlertTriangle, Car, Globe, Clock, Edit, ChevronDown, ChevronUp
} from 'lucide-react';

export default function VolunteerProfiles() {
  const { campaign } = useCampaign();
  const [search, setSearch] = useState('');
  const [editingProfile, setEditingProfile] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['volunteer_profiles', campaign?.id],
    queryFn: () => base44.entities.VolunteerProfile.filter({ campaign_id: campaign?.id }, '-created_date', 100),
    enabled: !!campaign?.id,
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs', campaign?.id],
    queryFn: () => base44.entities.Turf.filter({ campaign_id: campaign?.id }),
    enabled: !!campaign?.id,
  });

  const { data: leafletRuns = [] } = useQuery({
    queryKey: ['leaflet_runs', campaign?.id],
    queryFn: () => base44.entities.LeafletRun.filter({ campaign_id: campaign?.id }),
    enabled: !!campaign?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VolunteerProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_profiles', campaign?.id] });
      setEditingProfile(null);
    },
  });

  const filtered = profiles.filter(p =>
    !search.trim() ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: profiles.length,
    complete: profiles.filter(p => p.setup_complete).length,
    locationConsent: profiles.filter(p => p.location_tracking_consent).length,
    noEmergency: profiles.filter(p => !p.emergency_contact_phone).length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Volunteer Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage volunteer details, assignments, and welfare information</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/volunteer-setup'}>
          + My Profile
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total profiles', value: stats.total, icon: User, color: 'text-primary' },
          { label: 'Setup complete', value: stats.complete, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Location consent', value: stats.locationConsent, icon: MapPin, color: 'text-blue-600' },
          { label: 'No emergency contact', value: stats.noEmergency, icon: AlertTriangle, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Profiles list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground text-sm py-12">
            {profiles.length === 0
              ? 'No volunteer profiles yet. Volunteers complete their setup at /volunteer-setup.'
              : 'No profiles match your search.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              turfs={turfs}
              leafletRuns={leafletRuns}
              expanded={expandedId === profile.id}
              onToggle={() => setExpandedId(expandedId === profile.id ? null : profile.id)}
              onEdit={() => setEditingProfile({ ...profile })}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editingProfile && (
        <EditProfileDialog
          profile={editingProfile}
          turfs={turfs}
          leafletRuns={leafletRuns}
          onSave={(data) => updateMutation.mutate({ id: editingProfile.id, data })}
          onClose={() => setEditingProfile(null)}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function ProfileCard({ profile, turfs, leafletRuns, expanded, onToggle, onEdit }) {
  const assignedTurfs = turfs.filter(t => profile.assigned_turf_ids?.includes(t.id));
  const assignedRuns = leafletRuns.filter(r => profile.assigned_leaflet_run_ids?.includes(r.id));

  const welfare = [];
  if (!profile.emergency_contact_phone) welfare.push('No emergency contact');
  if (!profile.location_tracking_consent) welfare.push('No location consent');
  if (!profile.phone) welfare.push('No phone number');

  return (
    <Card className={welfare.length > 0 ? 'border-amber-200' : ''}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{profile.full_name || profile.user_email}</p>
                {profile.setup_complete
                  ? <Badge className="bg-green-100 text-green-800 text-xs">Setup complete</Badge>
                  : <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending setup</Badge>
                }
                {welfare.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs gap-1">
                    <AlertTriangle className="w-3 h-3" /> Welfare gap
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.user_email}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {profile.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{profile.phone}</span>}
                {profile.has_vehicle && <span className="flex items-center gap-1"><Car className="w-3 h-3" />Has car</span>}
                {profile.languages?.length > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{profile.languages.join(', ')}</span>}
                {profile.availability?.length > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{profile.availability.slice(0,3).join(', ')}{profile.availability.length > 3 ? '…' : ''}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onEdit}><Edit className="w-3 h-3" /></Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Welfare warnings */}
            {welfare.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Welfare information gaps:</p>
                <ul className="text-xs text-amber-700 space-y-0.5 list-disc ml-4">
                  {welfare.map(w => <li key={w}>{w}</li>)}
                </ul>
              </div>
            )}

            {/* Emergency contact */}
            {profile.emergency_contact_name && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Emergency Contact</p>
                <p className="text-sm">{profile.emergency_contact_name} ({profile.emergency_contact_relation || 'contact'}) — {profile.emergency_contact_phone}</p>
              </div>
            )}

            {/* Assignments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Assigned Turfs ({assignedTurfs.length})</p>
                {assignedTurfs.length === 0
                  ? <p className="text-xs text-muted-foreground">None assigned</p>
                  : assignedTurfs.map(t => <Badge key={t.id} variant="outline" className="mr-1 mb-1 text-xs">{t.name}</Badge>)
                }
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Leaflet Runs ({assignedRuns.length})</p>
                {assignedRuns.length === 0
                  ? <p className="text-xs text-muted-foreground">None assigned</p>
                  : assignedRuns.map(r => <Badge key={r.id} variant="outline" className="mr-1 mb-1 text-xs">{r.street_name}</Badge>)
                }
              </div>
            </div>

            {/* Preferred areas */}
            {profile.areas_preferred?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Preferred Areas</p>
                <div className="flex flex-wrap gap-1">
                  {profile.areas_preferred.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                </div>
              </div>
            )}

            {/* Notes */}
            {profile.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Organiser notes</p>
                <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">{profile.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EditProfileDialog({ profile, turfs, leafletRuns, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({
    assigned_turf_ids: profile.assigned_turf_ids || [],
    assigned_leaflet_run_ids: profile.assigned_leaflet_run_ids || [],
    team_lead_email: profile.team_lead_email || '',
    notes: profile.notes || '',
  });

  const toggleTurf = (id) => setForm(f => ({
    ...f,
    assigned_turf_ids: f.assigned_turf_ids.includes(id)
      ? f.assigned_turf_ids.filter(x => x !== id)
      : [...f.assigned_turf_ids, id],
  }));

  const toggleRun = (id) => setForm(f => ({
    ...f,
    assigned_leaflet_run_ids: f.assigned_leaflet_run_ids.includes(id)
      ? f.assigned_leaflet_run_ids.filter(x => x !== id)
      : [...f.assigned_leaflet_run_ids, id],
  }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign & Edit — {profile.full_name || profile.user_email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">

          <div>
            <label className="text-sm font-medium mb-2 block">Assign Turfs</label>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
              {turfs.length === 0 && <p className="text-xs text-muted-foreground">No turfs created yet</p>}
              {turfs.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-muted/30 rounded">
                  <input
                    type="checkbox"
                    checked={form.assigned_turf_ids.includes(t.id)}
                    onChange={() => toggleTurf(t.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{t.name}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{t.status}</Badge>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Assign Leaflet Runs</label>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
              {leafletRuns.length === 0 && <p className="text-xs text-muted-foreground">No leaflet runs created yet</p>}
              {leafletRuns.map(r => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-muted/30 rounded">
                  <input
                    type="checkbox"
                    checked={form.assigned_leaflet_run_ids.includes(r.id)}
                    onChange={() => toggleRun(r.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{r.street_name}</span>
                  {r.area && <Badge variant="secondary" className="text-xs ml-auto">{r.area}</Badge>}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Team Lead Email</label>
            <Input
              value={form.team_lead_email}
              onChange={e => setForm(f => ({ ...f, team_lead_email: e.target.value }))}
              placeholder="teamlead@example.com"
            />
            <p className="text-xs text-muted-foreground">Welfare check-in notifications will reference this person.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Organiser Notes (not visible to volunteer)</label>
            <textarea
              className="w-full text-sm border rounded-lg p-2 min-h-[70px] bg-background"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any special notes about this volunteer…"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(form)} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}