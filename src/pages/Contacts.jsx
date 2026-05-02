import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import useSecureData from '@/hooks/useSecureData';
import DataFetchError from '@/components/DataFetchError';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, CheckCircle2, Tag, GitMerge, Loader2, Navigation, Zap, Merge } from 'lucide-react';
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
  const { campaignId } = useCampaign();

  const { data: contacts = [], error: contactError, isLoading, refetch } = useSecureData(
    'getContactDetails',
    { campaign_id: campaignId },
    { staleTime: 120000, refetchInterval: 120000 }
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => { refetch(); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => { refetch(); setEditing(null); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => refetch(),
  });

  const [deduping, setDeduping] = useState(false);
  const [dedupeResult, setDedupeResult] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState(null);
  const [showInfraPanel, setShowInfraPanel] = useState(false);

  const handleDeduplicate = async () => {
    if (!confirm('This will merge duplicate addresses, combining their tags into one record. Continue?')) return;
    setDeduping(true);
    setDedupeResult(null);
    try {
      const response = await base44.functions.invoke('deduplicateContacts', { campaign_id: campaignId });
      refetch();
      setPage(1);
      setDedupeResult(response.data);
    } finally {
      setDeduping(false);
    }
  };

  const handleBatchGeocode = async () => {
    if (!confirm('Geocode all contacts lacking location data? This may take a few minutes.')) return;
    setGeocoding(true);
    setGeocodeResult(null);
    try {
      const response = await base44.functions.invoke('batchGeocodeContacts', { campaign_id: campaignId });
      refetch();
      setGeocodeResult(response.data);
    } finally {
      setGeocoding(false);
    }
  };

  const handleAssignTurfs = async () => {
    if (!confirm('Extract electoral area codes from postcodes and assign turf zones? This may take a minute.')) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const response = await base44.functions.invoke('assignTurfTagsByElectoralArea', { campaign_id: campaignId });
      refetch();
      setAssignResult(response.data);
    } finally {
      setAssigning(false);
    }
  };

  const handleReprocessImports = async () => {
    if (!confirm('Re-analyze recent import files to recover zone data? This may take a few minutes.')) return;
    setReprocessing(true);
    setReprocessResult(null);
    try {
      const response = await base44.functions.invoke('reprocessImportsForTurfTags', { campaign_id: campaignId });
      refetch();
      setReprocessResult(response.data);
    } finally {
      setReprocessing(false);
    }
  };

  const bulkTagMutation = useMutation({
    mutationFn: async ({ tags, mode }) => {
      const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
      await Promise.all(
        selectedContacts.map(contact => {
          let newTags;
          if (mode === 'apply') {
            newTags = [...new Set([...(contact.tags || []), ...tags])];
          } else if (mode === 'remove') {
            newTags = (contact.tags || []).filter(t => !tags.includes(t));
          } else {
            // replace
            newTags = tags;
          }
          return base44.entities.Contact.update(contact.id, { tags: newTags });
        })
      );
    },
    onSuccess: () => {
      refetch();
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
      {contactError && (
        <div className="mb-6">
          <DataFetchError error={contactError} onRetry={refetch} title="Unable to Load Contacts" />
        </div>
      )}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">Voter Contacts</h1>
            <p className="text-muted-foreground mt-1">
              {contacts.length.toLocaleString()} contacts total{filtered.length !== contacts.length ? ` · ${filtered.length.toLocaleString()} shown` : ''}
              {contacts.length > 0 && (() => {
                // Exclude latitude=0 sentinel from geocoded count
                const geocoded = contacts.filter(c => c.latitude != null && c.latitude !== 0).length;
                const failed = contacts.filter(c => c.latitude === 0).length;
                const withAddr = contacts.filter(c => c.address?.trim() || c.postcode?.trim()).length;
                const pct = withAddr > 0 ? Math.round((geocoded / withAddr) * 100) : 0;
                return (
                  <span className={`ml-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : pct > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    <MapPin className="w-3 h-3" />
                    {geocoded.toLocaleString()}/{withAddr.toLocaleString()} geocoded ({pct}%){failed > 0 ? ` · ${failed} no postcode` : ''}
                  </span>
                );
              })()}
            </p>
          </div>
          <Button 
            onClick={() => { setEditing(null); setShowForm(true); }} 
            size="sm"
            className="gap-2 w-fit"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        </div>

        {/* Infrastructure Setup Panel — collapsible */}
        <div className="mb-6">
          <button
            onClick={() => setShowInfraPanel(p => !p)}
            className="flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Data Setup Tools {showInfraPanel ? '▲' : '▼'}
          </button>
          {showInfraPanel && (
            <div className="mt-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-700 mb-3">Run these to set up geocoding and turf zone data for field tools.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button onClick={handleAssignTurfs} variant="outline" size="sm" className="gap-2 justify-start bg-white hover:bg-blue-50 border-blue-200 text-blue-900" disabled={assigning || isLoading}>
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                  <span className="text-left">
                    <div className="font-medium text-xs">Assign Turfs</div>
                    <div className="text-xs text-muted-foreground">Extract electoral zones</div>
                  </span>
                </Button>
                <Button onClick={handleReprocessImports} variant="outline" size="sm" className="gap-2 justify-start bg-white hover:bg-blue-50 border-blue-200 text-blue-900" disabled={reprocessing || isLoading}>
                  {reprocessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
                  <span className="text-left">
                    <div className="font-medium text-xs">Recover Zones</div>
                    <div className="text-xs text-muted-foreground">Re-analyze import files</div>
                  </span>
                </Button>
                <Button onClick={handleBatchGeocode} variant="outline" size="sm" className="gap-2 justify-start bg-white hover:bg-blue-50 border-blue-200 text-blue-900" disabled={geocoding || isLoading}>
                  {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  <span className="text-left">
                    <div className="font-medium text-xs">Geocode All</div>
                    <div className="text-xs text-muted-foreground">Add map coordinates</div>
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate(`/route${turfFilter !== 'all' ? `?turf=${encodeURIComponent(turfFilter)}` : ''}`)}
          >
            <Navigation className="w-4 h-4" /> Plan Route
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleDeduplicate}
            disabled={deduping || isLoading}
          >
            {deduping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
            Deduplicate
          </Button>

        </div>
      </div>

      {deduping && (
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
          <p className="text-sm text-primary font-medium">Deduplicating contacts on the server — you can navigate away freely.</p>
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

       {geocoding && (
         <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
           <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
           <p className="text-sm text-primary font-medium">Geocoding contacts (postcodes.io + Nominatim fallback) — you can navigate away freely.</p>
         </div>
       )}

       {geocodeResult && !geocoding && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center justify-between">
            <span>
              Geocoded <strong>{geocodeResult.results.succeeded}</strong> contacts — {geocodeResult.results.failed} failed (no valid postcode).
            </span>
            <button onClick={() => setGeocodeResult(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
          </div>
        )}

        {assigning && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            <p className="text-sm text-primary font-medium">Extracting electoral zones from postcodes — you can navigate away freely.</p>
          </div>
        )}

        {assignResult && !assigning && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center justify-between">
            <span>
              Tagged <strong>{assignResult.contacts_tagged}</strong> contacts with turf zones.
            </span>
            <button onClick={() => setAssignResult(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
          </div>
        )}

        {reprocessing && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            <p className="text-sm text-primary font-medium">Re-analyzing import files — you can navigate away freely.</p>
          </div>
        )}

        {reprocessResult && !reprocessing && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center justify-between">
            <span>
              Added <strong>{reprocessResult.total_tags_added}</strong> zone tags from {reprocessResult.files_processed} files.
            </span>
            <button onClick={() => setReprocessResult(null)} className="text-green-600 hover:text-green-800 ml-4">✕</button>
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
        onApply={(tags, mode) => bulkTagMutation.mutate({ tags, mode })}
        loading={bulkTagMutation.isPending}
      />
    </div>
  );
}