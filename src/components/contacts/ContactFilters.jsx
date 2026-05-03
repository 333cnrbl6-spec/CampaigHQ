import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function ContactFilters({ search, setSearch, filter, setFilter, sortBy, setSortBy, onFilterChange }) {
  const handleFilterChange = (type, value) => {
    if (type === 'search') setSearch(value);
    if (type === 'filter') setFilter(value);
    if (type === 'sort') setSortBy(value);
    onFilterChange?.();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 overflow-x-auto">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10 text-sm"
        />
      </div>
      <Select value={filter} onValueChange={(v) => handleFilterChange('filter', v)}>
        <SelectTrigger className="w-full sm:w-[140px] flex-shrink-0">
          <SelectValue placeholder="Filter" />
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
      <Select value={sortBy} onValueChange={(v) => handleFilterChange('sort', v)}>
        <SelectTrigger className="w-full sm:w-[120px] flex-shrink-0">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Sort: Name</SelectItem>
          <SelectItem value="turf">Sort: Turf Zone</SelectItem>
          <SelectItem value="address">Sort: Address</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}