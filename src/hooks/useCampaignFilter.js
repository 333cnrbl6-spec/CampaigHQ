import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';

/**
 * Hook that automatically filters entity queries by campaign_id
 * Wraps the base44 entity methods with campaign scoping
 */
export function useCampaignFilter(entityName) {
  const { campaign } = useCampaign();

  // Return wrapped methods that auto-filter by campaign
  return {
    // list: auto-filter by campaign_id
    list: async (sortField = '_id', limit = 1000) => {
      const all = await base44.entities[entityName].list(sortField, limit);
      if (!campaign?.id) return all;
      return all.filter(record => record.campaign_id === campaign.id);
    },

    // filter: apply additional filters AND campaign_id
    filter: async (filterObj = {}, sortField = '_id', limit = 1000) => {
      const all = await base44.entities[entityName].list(sortField, limit);
      if (!campaign?.id) return all;
      return all.filter(record => {
        // Check campaign match
        if (record.campaign_id !== campaign.id) return false;
        // Check additional filters
        for (const [key, value] of Object.entries(filterObj)) {
          if (record[key] !== value) return false;
        }
        return true;
      });
    },

    // create: auto-inject campaign_id
    create: async (data) => {
      if (!campaign?.id) throw new Error('No campaign selected');
      return base44.entities[entityName].create({
        ...data,
        campaign_id: campaign.id,
      });
    },

    // update: pass through
    update: (id, data) => base44.entities[entityName].update(id, data),

    // delete: pass through
    delete: (id) => base44.entities[entityName].delete(id),
  };
}

/**
 * React Query wrapper for campaign-filtered list queries
 */
export function useCampaignFilteredQuery(entityName, options = {}) {
  const { campaign } = useCampaign();
  const { sortField = '_id', limit = 1000, ...queryOptions } = options;

  return useQuery({
    queryKey: [entityName, campaign?.id],
    queryFn: async () => {
      const all = await base44.entities[entityName].list(sortField, limit);
      if (!campaign?.id) return all;
      return all.filter(record => record.campaign_id === campaign.id);
    },
    enabled: !!campaign?.id,
    ...queryOptions,
  });
}