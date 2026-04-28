import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const POSTCODES = ['M29 7', 'M29 8', 'M28', 'WN7'];

const SUPPORT_OPTIONS = [
  { value: 'all', label: 'All support levels' },
  { value: 'strong_supporter', label: 'Strong Supporters' },
  { value: 'leaning', label: 'Leaning' },
  { value: 'undecided', label: 'Undecided' },
  { value: 'opposed', label: 'Opposed' },
  { value: 'unknown', label: 'Unknown' },
];

const VOTER_OPTIONS = [
  { value: 'all', label: 'All contacts' },
  { value: 'registered', label: 'Registered Voters only' },
  { value: 'canvassed', label: 'Canvassed only' },
  { value: 'not_canvassed', label: 'Not yet canvassed' },
  { value: 'volunteers', label: 'Volunteers only' },
  { value: 'has_email', label: 'Have email address' },
  { value: 'has_phone', label: 'Have phone number' },
];

export default function AudienceFilter({ contacts, filters, onChange }) {
  const { support, voter, postcode } = filters;

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      if (support !== 'all' && c.support_level !== support) return false;
      if (voter === 'registered' && !c.registered_voter) return false;
      if (voter === 'canvassed' && !c.canvassed) return false;
      if (voter === 'not_canvassed' && c.canvassed) return false;
      if (voter === 'volunteers' && !c.volunteer) return false;
      if (voter === 'has_email' && !c.email) return false;
      if (voter === 'has_phone' && !c.phone) return false;
      if (postcode !== 'all') {
        if (!(c.postcode || '').toUpperCase().startsWith(postcode)) return false;
      }
      return true;
    });
  }, [contacts, support, voter, postcode]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">1. Select Audience</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Support Level</label>
          <Select value={support} onValueChange={v => onChange({ ...filters, support: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Contact Status</label>
          <Select value={voter} onValueChange={v => onChange({ ...filters, voter: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VOTER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Postcode Area</label>
          <Select value={postcode} onValueChange={v => onChange({ ...filters, postcode: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {POSTCODES.map(p => <SelectItem key={p} value={p}>{p} area</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-primary/8 rounded-lg px-4 py-2.5">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {filtered.length} contact{filtered.length !== 1 ? 's' : ''} match this audience
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          ({filtered.filter(c => c.email).length} with email · {filtered.filter(c => c.phone).length} with phone)
        </span>
      </div>

      {/* Preview list */}
      {filtered.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {filtered.slice(0, 50).map(c => (
            <div key={c.id} className="flex items-center gap-3 text-xs text-muted-foreground px-1">
              <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {c.name?.charAt(0)}
              </span>
              <span className="flex-1 font-medium text-foreground">{c.name}</span>
              <span>{c.email || '—'}</span>
              <span>{c.phone || '—'}</span>
            </div>
          ))}
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center pt-1">…and {filtered.length - 50} more</p>
          )}
        </div>
      )}
    </div>
  );
}