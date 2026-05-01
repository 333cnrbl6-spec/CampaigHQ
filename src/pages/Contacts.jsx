import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, CheckCircle2, Tag, GitMerge, Loader2, Navigation } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ContactForm from '../components/contacts/ContactForm';
import BulkTagDialog from '../components/contacts/BulkTagDialog';

const supportBadge = {
  strong_supporter: 'bg-primary/15 text-primary border-primary/25',
  leaning: 'bg-green-100 text-green-700 border-green-200',
  undecided: 'bg-amber-100 text-amber-700 border-amber-200',
  opposed: 'bg-red-100 text-red-700 border-red-200',
  unknown: 'bg-muted text-muted-foreground border-border',
};

export default function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [turfFilter, setTurfFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setEditing(null); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const [deduping, setDeduping] = useState(false);
  const [dedupeResult, setDedupeResult] = useState(null);
  const [dedupeProgress, setDedupeProgress] = useState({ done: 0, total: 0, deleted: 0 });

  const handleDeduplicate = async () => {
    if (!confirm('This will merge duplicate addresses, combining their tags into one record. Continue?')) return;
    setDeduping(true);
    setDedupeResult(null);
    setDedupeProgress({ done: 0, total: 0, deleted: 0 });
    try {
      // Group by normalised address (lowercase, trimmed)
      const groups = {};
      for (const c of contacts) {
        const key = (c.address || c.name || '').toLowerCase().trim();
        if (!key) continue;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }

      const duplicateGroups = Object.values(groups).filter(g => g.length > 1);
      let merged = 0;
      let deleted = 0;
      setDedupeProgress({ done: 0, total: duplicateGroups.length, deleted: 0 });

      const delay = (ms) => new Promise(r => setTimeout(r, ms));

      const callWithRetry = async (fn) => {
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            return await fn();
          } catch (err) {
            if (attempt === 5) throw err;
            await delay(attempt * 1500);
          }
        }
      };

      for (const group of duplicateGroups) {
        // Sort: prefer records with more data (phone/email/notes)
        group.sort((a, b) => {
          const scoreA = (a.phone ? 1 : 0) + (a.email ? 1 : 0) + (a.notes ? 1 : 0);
          const scoreB = (b.phone ? 1 : 0) + (b.email ? 1 : 0) + (b.notes ? 1 : 0);
          return scoreB - scoreA;
        });

        const [keep, ...dupes] = group;

        const allTags = [...new Set([
          ...(keep.tags || []),
          ...dupes.flatMap(d => d.tags || []),
        ])];

        const mergedData = {
          tags: allTags,
          phone: keep.phone || dupes.find(d => d.phone)?.phone,
          email: keep.email || dupes.find(d => d.email)?.email,
          notes: [keep.notes, ...dupes.map(d => d.notes)].filter(Boolean).join(' | ') || undefined,
          registered_voter: keep.registered_voter || dupes.some(d => d.registered_voter),
          volunteer: keep.volunteer || dupes.some(d => d.volunteer),
          // Prefer the most specific (longest) postcode found across all duplicates
          postcode: [keep, ...dupes].map(d => d.postcode).filter(Boolean).sort((a, b) => b.length - a.length)[0] || keep.postcode || undefined,
        };

        try {
          await callWithRetry(() => base44.entities.Contact.update(keep.id, mergedData));
          merged++;
        } catch (err) {
          if (!err?.message?.includes('not found')) throw err;
          // Keeper was already deleted — skip this group entirely
        }
        await delay(300);

        for (const dupe of dupes) {
          try {
            await callWithRetry(() => base44.entities.Contact.delete(dupe.id));
            deleted++;
          } catch (err) {
            if (!err?.message?.includes('not found')) throw err;
            // Already deleted in a previous run — skip silently
          }
          await delay(200);
        }

        setDedupeProgress({ done: merged, total: duplicateGroups.length, deleted });
      }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setPage(1);
      setDedupeResult({ merged, deleted, groups: duplicateGroups.length });
    } finally {
      setDeduping(false);
    }
  };

  const bulkTagMutation = useMutation({
    mutationFn: async (tags) => {
      const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
      await Promise.all(
        selectedContacts.map(contact =>
          base44.entities.Contact.update(contact.id, {
            tags: [...(contact.tags || []), ...tags].filter((v, i, a) => a.indexOf(v) === i),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedIds(new Set());
      setShowTagDialog(false);
    },
  });

  // Derive all turf zones from tags
  const allTurfs = [...new Set(contacts.flatMap(c => c.tags || []))].filter(Boolean).sort();

  const filtered = contacts.filter(c => {
    const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.postcode?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true :
      filter === 'voters' ? c.registered_voter :
      filter === 'non-voters' ? !c.registered_voter :
      c.support_level === filter;
    const matchesTurf = turfFilter === 'all' ? true : (c.tags || []).includes(turfFilter);
    return matchesSearch && matchesFilter && matchesTurf;
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'turf') {
      const ta = (a.tags || [])[0] || '';
      const tb = (b.tags || [])[0] || '';
      return ta.localeCompare(tb) || (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'address') return (a.address || '').localeCompare(b.address || '');
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSelectContact = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const filteredIds = new Set(filtered.map(c => c.id));
    const allFilteredSelected = filtered.every(c => selectedIds.has(c.id));
    if (allFilteredSelected) {
      // Deselect only the currently filtered contacts (preserve any cross-filter selections)
      const newSelected = new Set(selectedIds);
      filteredIds.forEach(id => newSelected.delete(id));
      setSelectedIds(newSelected);
    } else {
      setSelectedIds(filteredIds);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Voter Contacts</h1>
          <p className="text-muted-foreground mt-1">{contacts.length.toLocaleString()} contacts total{filtered.length !== contacts.length ? ` · ${filtered.length.toLocaleString()} shown` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDeduplicate}
            variant="outline"
            className="gap-2"
            disabled={deduping || isLoading}
          >
            {deduping ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
            {deduping ? 'Merging…' : 'Deduplicate'}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/route${turfFilter !== 'all' ? `?turf=${encodeURIComponent(turfFilter)}` : ''}`)}
          >
            <Navigation className="w-4 h-4" /> Plan Route
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        </div>
      </div>

      {deduping && dedupeProgress.total > 0 && (
        <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">
                Merging group {dedupeProgress.done} of {dedupeProgress.total}…
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dedupeProgress.deleted} duplicate records removed so far
              </p>
            </div>
            <span className="text-xs font-semibold text-primary flex-shrink-0">
              {Math.round((dedupeProgress.done / dedupeProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, (dedupeProgress.done / dedupeProgress.total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">⏳ Please keep this tab open — do not navigate away</p>
        </div>
      )}

      {dedupeResult && !deduping && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center justify-between">
          <span>
            Merged <strong>{dedupeResult.groups}</strong> duplicate groups — kept {dedupeResult.merged} records, removed <strong>{dedupeResult.deleted}</strong> duplicates.
          </span>
          <button onClick={() => setDedupeResult(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
            <ContactForm
              contact={editing}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Bulk Actions */}
       <div className="space-y-4 mb-6">
         <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="Search by name, address, postcode..."
               value={search}
               onChange={(e) => { setSearch(e.target.value); setPage(1); }}
               className="pl-10"
             />
           </div>
           <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="voters">Registered Voters</SelectItem>
                <SelectItem value="non-voters">Non-Voters</SelectItem>
                <SelectItem value="strong_supporter">Strong Supporter</SelectItem>
                <SelectItem value="leaning">Leaning</SelectItem>
                <SelectItem value="undecided">Undecided</SelectItem>
                <SelectItem value="opposed">Opposed</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Select value={turfFilter} onValueChange={(v) => { setTurfFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Turf zone..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Turfs</SelectItem>
                {allTurfs.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="turf">Sort: Turf Zone</SelectItem>
                <SelectItem value="address">Sort: Address</SelectItem>
              </SelectContent>
            </Select>
           </div>

         {/* Bulk Actions Bar */}
         {selectedIds.size > 0 && (
           <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <input
                 type="checkbox"
                 checked={filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))}
                 onChange={handleSelectAll}
                 className="w-4 h-4 rounded cursor-pointer"
               />
               <span className="text-sm font-medium">{selectedIds.size} selected</span>
             </div>
             <Button
               onClick={() => setShowTagDialog(true)}
               variant="outline"
               size="sm"
               className="gap-2"
             >
               <Tag className="w-4 h-4" />
               Apply Tags
             </Button>
           </div>
         )}
       </div>

      {/* Contact List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No contacts found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
           {paginated.map((contact) => (
             <div key={contact.id} className={`bg-card rounded-xl border p-4 hover:shadow-sm transition-all flex items-center gap-4 cursor-pointer ${selectedIds.has(contact.id) ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
               <input
                 type="checkbox"
                 checked={selectedIds.has(contact.id)}
                 onChange={() => handleSelectContact(contact.id)}
                 className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
               />
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                 <span className="text-sm font-bold text-primary">
                   {contact.name?.charAt(0)?.toUpperCase()}
                 </span>
               </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{contact.name}</p>
                  {contact.registered_voter && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Registered Voter
                    </Badge>
                  )}
                  <Badge variant="secondary" className={`text-xs border ${supportBadge[contact.support_level] || supportBadge.unknown}`}>
                    {contact.support_level?.replace(/_/g, ' ')}
                  </Badge>
                  {contact.volunteer && (
                    <Badge variant="secondary" className="text-xs bg-accent/20 text-accent-foreground border-accent/30">
                      Volunteer
                    </Badge>
                  )}
                  {contact.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                  {contact.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{contact.address}</span>}
                  {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                  {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(contact); setShowForm(true); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(`Delete ${contact.name}?`)) deleteMutation.mutate(contact.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* Bulk Tag Dialog */}
      <BulkTagDialog
        isOpen={showTagDialog}
        onOpenChange={setShowTagDialog}
        selectedCount={selectedIds.size}
        onApply={(tags) => bulkTagMutation.mutate(tags)}
        loading={bulkTagMutation.isPending}
      />
    </div>
  );
}