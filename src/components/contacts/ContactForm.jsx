import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const SUPPORT_LEVELS = [
  { value: 'strong_supporter', label: 'Strong Supporter' },
  { value: 'leaning', label: 'Leaning' },
  { value: 'undecided', label: 'Undecided' },
  { value: 'opposed', label: 'Opposed' },
  { value: 'unknown', label: 'Unknown' },
];

export default function ContactForm({ contact, onSubmit, onCancel }) {
  const [form, setForm] = useState(contact || {
    name: '', address: '', postcode: '', phone: '', email: '',
    support_level: 'unknown', notes: '', canvassed: false, volunteer: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold">
          {contact ? 'Edit Contact' : 'Add Contact'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Voter name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Support Level</Label>
            <Select value={form.support_level} onValueChange={(v) => setForm({ ...form, support_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORT_LEVELS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <Label>Postcode</Label>
            <Input
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              placeholder="e.g. M29 8..."
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Conversation notes, concerns raised..."
            rows={3}
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.canvassed}
              onChange={(e) => setForm({ ...form, canvassed: e.target.checked, canvass_date: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
              className="rounded border-border"
            />
            Canvassed
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.volunteer}
              onChange={(e) => setForm({ ...form, volunteer: e.target.checked })}
              className="rounded border-border"
            />
            Willing to volunteer
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{contact ? 'Update' : 'Add Contact'}</Button>
        </div>
      </form>
    </div>
  );
}