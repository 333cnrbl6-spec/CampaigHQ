import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function FieldModeSearch({ searchQuery, setSearchQuery, setSearchMode, filteredContacts, currentIndex, onSelectContact }) {
  return (
    <>
      {!searchQuery && (
        <div className="relative">
          <Input
            placeholder="Search by name, postcode, address..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchMode(e.target.value.trim().length > 0);
            }}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {searchQuery && filteredContacts.length > 0 && (
        <div className="max-h-96 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
          {filteredContacts.map((contact, idx) => (
            <button
              key={contact.id}
              onClick={() => onSelectContact(idx)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                idx === currentIndex
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <p className="font-medium text-sm">{contact.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{contact.address}</p>
              {contact.postcode && <p className="text-xs text-muted-foreground">{contact.postcode}</p>}
            </button>
          ))}
        </div>
      )}

      {searchQuery && filteredContacts.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No contacts found</p>
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="mt-2">
            Clear search
          </Button>
        </div>
      )}
    </>
  );
}