import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';

const supportBadge = {
  strong_supporter: 'bg-primary/15 text-primary border-primary/25',
  leaning: 'bg-green-100 text-green-700 border-green-200',
  undecided: 'bg-amber-100 text-amber-700 border-amber-200',
  opposed: 'bg-red-100 text-red-700 border-red-200',
  unknown: 'bg-muted text-muted-foreground border-border',
};

export default function ContactListItem({ contact, selected, onSelect, onEdit, onDelete }) {
  return (
    <div className={`bg-card rounded-lg sm:rounded-xl border p-3 sm:p-4 hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 cursor-pointer ${selected ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(contact.id)}
        className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
      />
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs sm:text-sm font-bold text-primary">
          {contact.name?.charAt(0)?.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <p className="font-medium text-sm leading-tight">{contact.name}</p>
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
        <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
          {contact.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="hidden sm:inline">{contact.address}</span></span>}
          {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /></span>}
          {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /></span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 self-start sm:self-center">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(contact)}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(contact)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}