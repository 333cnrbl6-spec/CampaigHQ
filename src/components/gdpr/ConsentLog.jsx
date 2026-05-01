import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const METHOD_LABELS = {
  door_knock: 'Door Knock',
  phone: 'Phone',
  email: 'Email',
  online_form: 'Online Form',
  electoral_roll: 'Electoral Roll',
  unknown: 'Unknown',
};

export default function ConsentLog() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts_gdpr'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const updateConsent = useMutation({
    mutationFn: ({ id, consent_given, consent_method }) =>
      base44.entities.Contact.update(id, {
        consent_given,
        consent_method: consent_method || 'unknown',
        consent_date: consent_given ? new Date().toISOString().split('T')[0] : null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts_gdpr'] }),
  });

  const filtered = contacts.filter(c => {
    const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.address?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'consented') return matchesSearch && c.consent_given;
    if (filter === 'no_consent') return matchesSearch && !c.consent_given;
    if (filter === 'deletion_pending') return matchesSearch && c.deletion_requested;
    return matchesSearch;
  });

  const consentedCount = contacts.filter(c => c.consent_given).length;
  const pendingCount = contacts.filter(c => !c.consent_given).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{consentedCount.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">Consent Recorded</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingCount.toLocaleString()}</p>
          <p className="text-xs text-amber-600 mt-1">No Consent on Record</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{contacts.length ? Math.round((consentedCount / contacts.length) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">Consent Rate</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="consented">Consented</SelectItem>
            <SelectItem value="no_consent">No Consent</SelectItem>
            <SelectItem value="deletion_pending">Deletion Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Method</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No contacts found</td></tr>
            )}
            {filtered.slice(0, 100).map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.address}</p>
                  {c.deletion_requested && <Badge variant="destructive" className="text-xs mt-1">Deletion Pending</Badge>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {METHOD_LABELS[c.consent_method] || '—'}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {c.consent_date ? format(new Date(c.consent_date), 'dd MMM yyyy') : '—'}
                </td>
                <td className="px-4 py-3">
                  {c.consent_given
                    ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Consented</span>
                    : <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> No Consent</span>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  {!c.consent_given ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={updateConsent.isPending}
                      onClick={() => updateConsent.mutate({ id: c.id, consent_given: true, consent_method: 'door_knock' })}
                    >
                      Mark Consented
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                      disabled={updateConsent.isPending}
                      onClick={() => updateConsent.mutate({ id: c.id, consent_given: false, consent_method: 'unknown' })}
                    >
                      Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 100 && (
          <p className="text-xs text-muted-foreground text-center py-3">Showing first 100 of {filtered.length} results</p>
        )}
      </div>
    </div>
  );
}