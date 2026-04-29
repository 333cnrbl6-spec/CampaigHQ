import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2 } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

export default function SessionLogForm({ user }) {
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    volunteer_name: user?.full_name || '',
    volunteer_email: user?.email || '',
    session_date: today(),
    turf_id: '',
    street_name: '',
    doors_knocked: '',
    positive_responses: '',
    negative_responses: '',
    no_answers: '',
    undecided_count: '',
    leaflets_delivered: '',
    street_issues: '',
    general_notes: '',
    duration_minutes: '',
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('-created_date', 100),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = (k, v) => set(k, v === '' ? '' : Number(v));

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.CanvassingLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvassing-logs'] });
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      doors_knocked: Number(form.doors_knocked) || 0,
      positive_responses: Number(form.positive_responses) || 0,
      negative_responses: Number(form.negative_responses) || 0,
      no_answers: Number(form.no_answers) || 0,
      undecided_count: Number(form.undecided_count) || 0,
      leaflets_delivered: Number(form.leaflets_delivered) || 0,
      duration_minutes: Number(form.duration_minutes) || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle2 className="w-14 h-14 text-primary" />
        <h2 className="font-heading text-2xl font-bold">Session Logged!</h2>
        <p className="text-muted-foreground">Thanks {form.volunteer_name} — your session has been recorded.</p>
        <Button variant="outline" onClick={() => { setSubmitted(false); setForm(f => ({ ...f, street_name: '', doors_knocked: '', positive_responses: '', negative_responses: '', no_answers: '', undecided_count: '', leaflets_delivered: '', street_issues: '', general_notes: '', duration_minutes: '' })); }}>
          Log Another Session
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Who & When */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Your Name *</Label>
          <Input value={form.volunteer_name} onChange={e => set('volunteer_name', e.target.value)} required placeholder="Full name" />
        </div>
        <div className="space-y-1.5">
          <Label>Session Date *</Label>
          <Input type="date" value={form.session_date} onChange={e => set('session_date', e.target.value)} required />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Street / Area Covered</Label>
          <Input value={form.street_name} onChange={e => set('street_name', e.target.value)} placeholder="e.g. Elliott Street, Tyldesley" />
        </div>
        <div className="space-y-1.5">
          <Label>Turf (optional)</Label>
          <Select value={form.turf_id} onValueChange={v => set('turf_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select turf..." /></SelectTrigger>
            <SelectContent>
              {turfs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Door counts */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Door Counts *</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'doors_knocked', label: 'Doors Knocked', required: true },
            { key: 'positive_responses', label: 'Positive' },
            { key: 'negative_responses', label: 'Negative' },
            { key: 'no_answers', label: 'No Answer' },
          ].map(({ key, label, required }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}{required ? ' *' : ''}</Label>
              <Input
                type="number"
                min="0"
                value={form[key]}
                onChange={e => num(key, e.target.value)}
                required={required}
                placeholder="0"
                className="text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Secondary counts */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Undecided Voters</Label>
          <Input type="number" min="0" value={form.undecided_count} onChange={e => num('undecided_count', e.target.value)} placeholder="0" className="text-center" />
        </div>
        <div className="space-y-1.5">
          <Label>Leaflets Delivered</Label>
          <Input type="number" min="0" value={form.leaflets_delivered} onChange={e => num('leaflets_delivered', e.target.value)} placeholder="0" className="text-center" />
        </div>
        <div className="space-y-1.5">
          <Label>Duration (mins)</Label>
          <Input type="number" min="0" value={form.duration_minutes} onChange={e => num('duration_minutes', e.target.value)} placeholder="e.g. 90" className="text-center" />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Street Issues Raised</Label>
        <Textarea
          value={form.street_issues}
          onChange={e => set('street_issues', e.target.value)}
          placeholder="Note any specific issues residents mentioned — e.g. 'potholes on Church St', 'concerns about warehouse HGVs'"
          className="h-24"
        />
      </div>
      <div className="space-y-1.5">
        <Label>General Notes</Label>
        <Textarea
          value={form.general_notes}
          onChange={e => set('general_notes', e.target.value)}
          placeholder="Anything else worth noting from the session..."
          className="h-20"
        />
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto px-10">
        {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Submit Session Log'}
      </Button>
    </form>
  );
}