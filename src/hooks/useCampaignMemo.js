import React, { useMemo } from 'react';

/**
 * Memoized computation hook for campaign analytics
 * Prevents unnecessary recalculations on every render
 */
export const useCampaignStats = (contacts = [], logs = [], tasks = []) => {
  return useMemo(() => {
    const canvassed = Array.isArray(contacts) ? contacts.filter(c => c?.canvassed).length : 0;
    const supporters = Array.isArray(contacts)
      ? contacts.filter(c => ['strong_supporter', 'leaning'].includes(c?.support_level)).length
      : 0;
    const activeTasks = Array.isArray(tasks) ? tasks.filter(t => t?.status !== 'done').length : 0;
    const doorsThisWeek = Array.isArray(logs) ? logs.reduce((sum, l) => sum + (l?.doors_knocked || 0), 0) : 0;
    
    const needsGeocoding = Array.isArray(contacts)
      ? contacts.filter(c => (!c?.latitude || !c?.longitude) && c?.latitude !== 0).length
      : 0;

    return {
      canvassed,
      supporters,
      activeTasks,
      doorsThisWeek,
      needsGeocoding,
      totalContacts: contacts.length,
      supportPercentage: contacts.length > 0 ? Math.round((supporters / contacts.length) * 100) : 0,
    };
  }, [contacts, logs, tasks]);
};

/**
 * Memoized filtering for contacts
 */
export const useFilteredContacts = (contacts = [], search = '', filter = 'all', turfFilter = 'all', sortBy = 'name') => {
  return useMemo(() => {
    const filtered = Array.isArray(contacts)
      ? contacts.filter(c => {
          const matchesSearch =
            !search ||
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.address?.toLowerCase().includes(search.toLowerCase()) ||
            c.postcode?.toLowerCase().includes(search.toLowerCase());

          const matchesFilter =
            filter === 'all'
              ? true
              : filter === 'voters'
              ? c.registered_voter
              : filter === 'non-voters'
              ? !c.registered_voter
              : c.support_level === filter;

          const matchesTurf = turfFilter === 'all' ? true : (c.tags || []).includes(turfFilter);

          return matchesSearch && matchesFilter && matchesTurf;
        })
      : [];

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'turf') {
        const ta = (a.tags || [])[0] || '';
        const tb = (b.tags || [])[0] || '';
        return ta.localeCompare(tb) || (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'address') return (a.address || '').localeCompare(b.address || '');
      return 0;
    });
  }, [contacts, search, filter, turfFilter, sortBy]);
};