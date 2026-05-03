import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataFetchError from '@/components/DataFetchError';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, MapPin, Clock, Users, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const EVENT_TYPES = ['canvassing', 'hustings', 'leafleting', 'meeting', 'social', 'fundraiser', 'other'];

const emptyEvent = {
  title: '', type: 'canvassing', date: '', time: '', location: '', description: '', status: 'upcoming', attendees_count: 0,
};

export default function Events() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEvent);
  const queryClient = useQueryClient();
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;

  const { data: events = [], error: eventError, isLoading, refetch } = useQuery({
    queryKey: ['events', campaignId],
    queryFn: () => base44.entities.CampaignEvent.filter({ campaign_id: campaignId }, '-date'),
    enabled: !!campaignId,
    staleTime: 180000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['events', campaignId] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignEvent.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => { invalidate(); setDialogOpen(false); setForm(emptyEvent); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CampaignEvent.update(id, data),
    onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); setForm(emptyEvent); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CampaignEvent.delete(id),
    onSuccess: () => invalidate(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (event) => {
    setEditing(event);
    setForm(event);
    setDialogOpen(true);
  };

  const upcoming = events.filter(e => e.status === 'upcoming');
  const past = events.filter(e => e.status !== 'upcoming');

  const EventCard = ({ event }) => (
    <div className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="text-center min-w-[52px] py-1">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              {event.date ? format(new Date(event.date), 'MMM') : ''}
            </div>
            <div className="text-2xl font-bold font-heading text-primary">
              {event.date ? format(new Date(event.date), 'd') : '—'}
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{event.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              {event.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.time}</span>}
              {event.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>}
              {event.attendees_count > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.attendees_count} attending</span>}
            </div>
            {event.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>}
            <Badge variant="secondary" className="mt-2 capitalize text-xs">{event.type?.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(event)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(event.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      {eventError && (
        <div className="mb-6">
          <DataFetchError error={eventError} onRetry={refetch} title="Unable to Load Events" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Campaign Events</h1>
          <p className="text-muted-foreground mt-1">{upcoming.length} upcoming events</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm(emptyEvent); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">{editing ? 'Edit Event' : 'Create Event'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="e.g. 10:00 AM" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Meeting point or venue" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Expected Attendees</Label>
                <Input type="number" value={form.attendees_count} onChange={(e) => setForm({ ...form, attendees_count: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); setForm(emptyEvent); }}>Cancel</Button>
                <Button type="submit">{editing ? 'Update' : 'Create Event'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Upcoming
              </h2>
              <div className="grid gap-3">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Past & Cancelled</h2>
              <div className="grid gap-3 opacity-70">{past.map(e => <EventCard key={e.id} event={e} />)}</div>
            </div>
          )}
          {events.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No events yet. Create your first campaign event.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}