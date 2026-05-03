import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { useTurfSelection } from '@/lib/TurfSelectionContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useSecureData from '@/hooks/useSecureData';
import useAuditLog from '@/hooks/useAuditLog';
import DataFetchError from '@/components/DataFetchError';
import ErrorBoundary from '@/components/ErrorBoundary';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Tag, GitMerge, Loader2, Navigation, Zap, Merge, MapPin } from 'lucide-react';
import ProcessingFeedback from '@/components/ui/ProcessingFeedback';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ContactForm from '../components/contacts/ContactForm';
import BulkTagDialog from '../components/contacts/BulkTagDialog';
import ContactFilters from '../components/contacts/ContactFilters';
import ContactListItem from '../components/contacts/ContactListItem';



export default function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { campaign } = useCampaign();
  const { selectedTurfId, setSelectedTurfId } = useTurfSelection();
  const { log: auditLog } = useAuditLog();
  const campaignId = campaign?.id;

  // Fetch all contacts for campaign via entity list (RLS-scoped by campaign_id)
  const { data: contacts = [], error: contactError, isLoading, refetch } = useQuery({
    queryKey: ['contacts', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      try {
        const all = await base44.entities.Contact.list('-created_date', 10000);
        return Array.isArray(all) ? all.filter(c => c.campaign_id === campaignId) : [];
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
        throw err;
      }
    },
    enabled: !!campaignId,
    staleTime: 120000,
    refetchInterval: 120000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!campaignId) throw new Error('Campaign ID is required');
      return base44.entities.Contact.create({ ...data, campaign_id: campaignId });
    },
    onSuccess: (newContact) => {
      auditLog({ action: 'create', entityType: 'contact', entityId: newContact.id, changes: newContact });
      refetch();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: (updated) => {
      auditLog({ action: 'update', entityType: 'contact', entityId: updated.id, changes: updated });
      refetch();
      setEditing(null);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: (_, id) => {
      auditLog({ action: 'delete', entityType: 'contact', entityId: id });
      refetch();
    },
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
    if (!campaignId) {
      alert('Campaign not loaded');
      return;
    }
    if (!confirm('This will merge duplicate addresses, combining their tags into one record. Continue?')) return;
    setDeduping(true);
    setDedupeResult(null);
    try {
      const response = await base44.functions.invoke('deduplicateContacts', { campaign_id: campaignId });
      refetch();
      setPage(1);
      setDedupeResult(response.data);
    } catch (err) {
      console.error('Deduplication failed:', err);
      alert('Deduplication failed — see console for details');
    } finally {
      setDeduping(false);
    }
  };

  const handleBatchGeocode = async () => {
    if (!campaignId) {
      alert('Campaign not loaded');
      return;
    }
    if (!confirm('Geocode all contacts lacking location data? This may take a few minutes.')) return;
    setGeocoding(true);
    setGeocodeResult(null);
    try {
      const response = await base44.functions.invoke('batchGeocodeContacts', { campaign_id: campaignId });
      refetch();
      setGeocodeResult(response.data);
    } catch (err) {
      console.error('Geocoding failed:', err);
      alert('Geocoding failed — see console for details');
    } finally {
      setGeocoding(false);
    }
  };

  const handleAssignTurfs = async () => {
    if (!campaignId) {
      alert('Campaign not loaded');
      return;
    }
    if (!confirm('Extract electoral area codes from postcodes and assign turf zones? This may take a minute.')) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const response = await base44.functions.invoke('assignTurfTagsByElectoralArea', { campaign_id: campaignId });
      refetch();
      setAssignResult(response.data);
    } catch (err) {
      console.error('Turf assignment failed:', err);
      alert('Turf assignment failed — see console for details');
    } finally {
      setAssigning(false);
    }
  };

  const handleReprocessImports = async () => {
    if (!campaignId) {
      alert('Campaign not loaded');
      return;
    }
    if (!confirm('Re-analyze recent import files to recover zone data? This may take a few minutes.')) return;
    setReprocessing(true);
    setReprocessResult(null);
    try {
      const response = await base44.functions.invoke('reprocessImportsForTurfTags', { campaign_id: campaignId });
      refetch();
      setReprocessResult(response.data);
    } catch (err) {
      console.error('Reprocess failed:', err);
      alert('Reprocess failed — see console for details');
    } finally {
      setReprocessing(false);
    }
  };

  const bulkTagMutation = useMutation({
    mutationFn: async ({ tags, mode }) => {
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('No tags provided');
      }
      const selectedContacts = Array.isArray(contacts) ? contacts.filter(c => selectedIds.has(c?.id)) : [];
      if (selectedContacts.length === 0) {
        throw new Error('No contacts selected');
      }
      
      const updates = selectedContacts.map(contact => {
        let newTags;
        if (mode === 'apply') {
          newTags = [...new Set([...(Array.isArray(contact.tags) ? contact.tags : []), ...tags])];
        } else if (mode === 'remove') {
          newTags = (Array.isArray(contact.tags) ? contact.tags : []).filter(t => !tags.includes(t));
        } else {
          // replace
          newTags = tags;
        }
        return base44.entities.Contact.update(contact.id, { tags: newTags });
      });
      
      return Promise.all(updates);
    },
    onSuccess: () => {
      refetch();
      setSelectedIds(new Set());
      setShowTagDialog(false);
    },
    onError: (err) => {
      console.error('Bulk tag error:', err);
      alert('Failed to apply tags: ' + err.message);
    },
  });

  // Derive all turf zones from tags (defensive against non-array)
  const allTurfs = useMemo(() =>
    Array.isArray(contacts) 
      ? [...new Set(contacts.flatMap(c => Array.isArray(c?.tags) ? c.tags : []))].filter(Boolean).sort()
      : [],
    [contacts]
  );

  const filtered = useMemo(() => contacts.filter(c => {
    const matchesSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase()) ||
      c.postcode?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true :
      filter === 'voters' ? c.registered_voter :
      filter === 'non-voters' ? !c.registered_voter :
      c.support_level === filter;
    const matchesTurf = !selectedTurfId ? true : (c.tags || []).length > 0;
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
  }), [contacts, search, filter, sortBy, selectedTurfId]);

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
    <div className="p-3 sm:p-6 lg:p-10 max-w-[1400px] mx-auto">
      {contactError && (
        <div className="mb-6">
          <DataFetchError error={contactError} onRetry={refetch} title="Unable to Load Contacts" />
        </div>
      )}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
           <div className="min-w-0">
             <h1 className="font-heading text-2xl sm:text-3xl font-bold">Voter Contacts</h1>
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
            onClick={() => navigate(`/route`)}
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
        <ProcessingFeedback
          className="mb-4"
          label="Deduplicating contacts…"
          detail="Scanning for duplicate addresses and merging records. You can navigate away freely."
          tips={[
            'Duplicate addresses are merged, combining all their tags.',
            'This usually finishes in 10–30 seconds depending on contact volume.',
            'No data is lost — the best record is kept and others are merged into it.',
          ]}
        />
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
         <ProcessingFeedback
           className="mb-4"
           label="Geocoding contacts…"
           detail="Looking up GPS coordinates for each postcode via postcodes.io. You can navigate away freely."
           tips={[
             'Each UK postcode is resolved to a lat/lng pair for map display and routing.',
             'If a full postcode fails, the outward code (e.g. M29) is tried as a fallback.',
             'Contacts without any postcode will be skipped and flagged in the results.',
             'This can take 1–3 minutes for large contact lists — hang tight!',
           ]}
         />
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
          <ProcessingFeedback
            className="mb-4"
            label="Assigning turf zones…"
            detail="Extracting electoral area codes from postcodes and tagging contacts. You can navigate away freely."
            tips={[
              'Postcode districts are matched to Tyldesley ward boundary zones.',
              'Each contact gets a zone tag (e.g. TYL5) that powers the Route Optimizer.',
              'Contacts already tagged will have their zone updated if it has changed.',
            ]}
          />
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
          <ProcessingFeedback
            className="mb-4"
            label="Recovering zone data from imports…"
            detail="Re-analyzing recent import files to extract turf tags. You can navigate away freely."
            tips={[
              'This reads the original import file names to identify zone codes (e.g. TYL5, TYL6).',
              'Zone tags are applied to contacts whose data came from those files.',
              'Useful after a bulk import that missed the zone assignment step.',
            ]}
          />
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
        {/* Turf selector — sync with global context */}
        {allTurfs.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-3">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Filter by Turf Zone</label>
            <Select value={selectedTurfId || ''} onValueChange={(v) => { setSelectedTurfId(v || null); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All zones</SelectItem>
                {allTurfs.map(turf => (
                  <SelectItem key={turf} value={turf}>
                    {turf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <ContactFilters 
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onFilterChange={() => setPage(1)}
        />

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
        <div className="grid gap-2 sm:gap-3">
           {paginated.map((contact) => (
             <ContactListItem
               key={contact.id}
               contact={contact}
               selected={selectedIds.has(contact.id)}
               onSelect={handleSelectContact}
               onEdit={(c) => { setEditing(c); setShowForm(true); }}
               onDelete={(c) => { if (confirm(`Delete ${c.name}?`)) deleteMutation.mutate(c.id); }}
             />
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