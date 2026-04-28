import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function LeafletRunForm({ run, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    street_name: run?.street_name || '',
    area: run?.area || 'Tyldesley',
    postcode: run?.postcode || '',
    assigned_to: run?.assigned_to || '',
    total_houses: run?.total_houses || '',
    leaflets_delivered: run?.leaflets_delivered || 0,
    status: run?.status || 'not_started',
    notes: run?.notes || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      total_houses: Number(form.total_houses) || 0,
      leaflets_delivered: Number(form.leaflets_delivered) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-lg">{run ? 'Edit Street' : 'Add Street'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Street Name *</Label>
          <Input value={form.street_name} onChange={e => set('street_name', e.target.value)} placeholder="e.g. Manchester Road" required />
        </div>
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Select value={form.area} onValueChange={v => set('area', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Tyldesley">Tyldesley</SelectItem>
              <SelectItem value="Mosley Common">Mosley Common</SelectItem>
              <SelectItem value="Astley">Astley</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Postcode</Label>
          <Input value={form.postcode} onChange={e => set('postcode', e.target.value)} placeholder="e.g. M29 7AB" />
        </div>
        <div className="space-y-1.5">
          <Label>Assigned Volunteer</Label>
          <Input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Volunteer name" />
        </div>
        <div className="space-y-1.5">
          <Label>Total Houses</Label>
          <Input type="number" min="0" value={form.total_houses} onChange={e => set('total_houses', e.target.value)} placeholder="e.g. 45" />
        </div>
        <div className="space-y-1.5">
          <Label>Leaflets Delivered</Label>
          <Input type="number" min="0" value={form.leaflets_delivered} onChange={e => set('leaflets_delivered', e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Notes</Label>
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes (e.g. flats only, no access)" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{run ? 'Update' : 'Add Street'}</Button>
      </div>
    </form>
  );
}