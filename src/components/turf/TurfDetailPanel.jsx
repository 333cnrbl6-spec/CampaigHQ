import React, { useMemo, useState } from 'react';
import { X, Users, MailCheck, CheckCircle2, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SUPPORT_COLORS = {
  strong_supporter: 'bg-green-100 text-green-800',
  leaning: 'bg-lime-100 text-lime-800',
  undecided: 'bg-yellow-100 text-yellow-800',
  opposed: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 10;

export default function TurfDetailPanel({ turf, contacts, onClose, onUpdateTurf }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Extract turf code same way the overlay does
  const turfCode = turf.name.replace(/\s+/g, '').toUpperCase().split('-')[0].trim();

  const turfContacts = useMemo(() => {
    return contacts.filter(c =>
      Array.isArray(c.tags) && c.tags.some(t => t.toUpperCase().replace(/\s+/g, '') === turfCode)
    );
  }, [contacts, turfCode]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return turfContacts;
    return turfContacts.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }, [turfContacts, search]);

  const pageContacts = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const postalCount = turfContacts.filter(c => Array.isArray(c.tags) && c.tags.includes('Postal Voter')).length;
  const canvassedCount = turfContacts.filter(c => c.canvassed).length;
  const canvassedPct = turfContacts.length > 0 ? Math.round((canvassedCount / turfContacts.length) * 100) : 0;

  const supportBreakdown = useMemo(() => {
    const map = {};
    turfContacts.forEach(c => {
      const s = c.support_level || 'unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return map;
  }, [turfContacts]);

  return (
    <div className="absolute top-4 right-4 bottom-4 z-[1000] w-80 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between gap-2 bg-primary/5">
        <div>
          <h2 className="font-heading font-bold text-base leading-tight">{turf.name}</h2>
          {turf.assigned_to && (
            <p className="text-xs text-muted-foreground mt-0.5">👤 {turf.assigned_to}</p>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-3 grid grid-cols-3 gap-2 border-b border-border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <Users className="w-3.5 h-3.5" />
          </div>
          <p className="font-bold text-lg leading-none">{turfContacts.length.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Contacts</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <MailCheck className="w-3.5 h-3.5" />
          </div>
          <p className="font-bold text-lg leading-none">{postalCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Postal</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <p className="font-bold text-lg leading-none">{canvassedPct}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Canvassed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Canvassing progress</span>
          <span>{canvassedCount} / {turfContacts.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-2 bg-primary rounded-full transition-all"
            style={{ width: `${canvassedPct}%` }}
          />
        </div>
      </div>

      {/* Support breakdown */}
      {Object.keys(supportBreakdown).length > 0 && (
        <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1">
          {Object.entries(supportBreakdown).map(([level, count]) => (
            <span key={level} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SUPPORT_COLORS[level] || 'bg-gray-100 text-gray-600'}`}>
              {level.replace('_', ' ')} ({count})
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search contacts…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 text-sm">
            <MapPin className="w-8 h-8 opacity-30" />
            {turfContacts.length === 0 ? 'No contacts imported for this zone yet.' : 'No results found.'}
          </div>
        ) : (
          pageContacts.map(c => (
            <div key={c.id} className="px-3 py-2 hover:bg-muted/40">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{c.name || c.address}</p>
                  {c.address && c.name && (
                    <p className="text-[10px] text-muted-foreground truncate">{c.address}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {c.canvassed && (
                    <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ Canvassed</span>
                  )}
                  {Array.isArray(c.tags) && c.tags.includes('Postal Voter') && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">📬 Postal</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-2 border-t border-border flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>←</Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>→</Button>
        </div>
      )}
    </div>
  );
}