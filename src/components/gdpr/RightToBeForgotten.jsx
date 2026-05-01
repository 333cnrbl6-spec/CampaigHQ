import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Search, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function RightToBeForgotten() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteLog, setDeleteLog] = useState(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts_deletion'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['gdpr_requests'],
    queryFn: () => base44.entities.GdprRequest.list('-created_date', 50),
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const flagForDeletion = useMutation({
    mutationFn: async (contact) => {
      await base44.entities.Contact.update(contact.id, {
        deletion_requested: true,
        deletion_requested_date: new Date().toISOString().split('T')[0],
      });
      await base44.entities.GdprRequest.create({
        request_type: 'right_to_be_forgotten',
        contact_id: contact.id,
        contact_name: contact.name,
        contact_email: contact.email || '',
        status: 'pending',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts_deletion'] });
      qc.invalidateQueries({ queryKey: ['gdpr_requests'] });
    },
  });

  const executeDeletes = async () => {
    const toDelete = contacts.filter(c => selectedIds.has(c.id));
    if (!toDelete.length) return;
    setDeleting(true);
    let count = 0;
    for (const c of toDelete) {
      await base44.entities.Contact.delete(c.id);
      // Mark associated GDPR request as completed
      const req = requests.find(r => r.contact_id === c.id && r.status === 'pending');
      if (req) {
        await base44.entities.GdprRequest.update(req.id, {
          status: 'completed',
          completed_date: new Date().toISOString().split('T')[0],
        });
      }
      count++;
    }
    setSelectedIds(new Set());
    setDeleteLog({ count, date: new Date() });
    setDeleting(false);
    qc.invalidateQueries({ queryKey: ['contacts_deletion'] });
    qc.invalidateQueries({ queryKey: ['gdpr_requests'] });
  };

  const flaggedContacts = contacts.filter(c => c.deletion_requested);
  const searchResults = search
    ? contacts.filter(c =>
        !c.deletion_requested &&
        (c.name?.toLowerCase().includes(search.toLowerCase()) ||
         c.email?.toLowerCase().includes(search.toLowerCase()) ||
         c.address?.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 20)
    : [];

  const toggle = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{pendingRequests.length}</p>
          <p className="text-xs text-red-600 mt-1">Pending Deletion Requests</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{requests.filter(r => r.status === 'completed').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed This Year</p>
        </div>
      </div>

      {deleteLog && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            <strong>{deleteLog.count} contact{deleteLog.count !== 1 ? 's' : ''} permanently deleted</strong> on {format(deleteLog.date, 'dd MMM yyyy HH:mm')}. GDPR log updated.
          </p>
        </div>
      )}

      {/* Search & flag */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-sm">Flag a Contact for Deletion</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or address…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {searchResults.length > 0 && (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {searchResults.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.address} {c.email ? `· ${c.email}` : ''}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 text-xs"
                  onClick={() => { flagForDeletion.mutate(c); setSearch(''); }}
                >
                  Flag for Deletion
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending deletions */}
      {flaggedContacts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Pending Deletion Queue</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Select records to permanently delete from the database.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedIds(new Set(flaggedContacts.map(c => c.id)))}
              >
                Select All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs gap-1.5"
                disabled={selectedIds.size === 0 || deleting}
                onClick={executeDeletes}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete {selectedIds.size > 0 ? selectedIds.size : ''} Record{selectedIds.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Deletion is <strong>permanent and irreversible</strong>. Ensure you have followed your organisation's GDPR process before proceeding.</p>
          </div>

          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {flaggedContacts.map(c => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selectedIds.has(c.id) ? 'bg-destructive/5' : 'hover:bg-muted/30'}`}
                onClick={() => toggle(c.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="rounded"
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.address}</p>
                </div>
                {c.deletion_requested_date && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    Requested {format(new Date(c.deletion_requested_date), 'dd MMM yyyy')}
                  </span>
                )}
                <Badge variant="destructive" className="text-xs flex-shrink-0">Pending</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request log */}
      {requests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Request Audit Log</h3>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {requests.slice(0, 20).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{r.contact_name}</p>
                  <p className="text-xs text-muted-foreground">{r.request_type.replace(/_/g, ' ')} · Logged {format(new Date(r.created_date), 'dd MMM yyyy')}</p>
                </div>
                <Badge variant={r.status === 'completed' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}