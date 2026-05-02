import { useCampaign } from '@/lib/CampaignContext';

/**
 * Returns a filter object to scope entity queries to the active campaign.
 * Usage:
 *   const campaignFilter = useCampaignFilter();
 *   base44.entities.Contact.filter(campaignFilter)
 *   base44.entities.Contact.filter({ ...campaignFilter, support_level: 'strong_supporter' })
 *
 * If the user is a super-admin with no campaign (null), returns {} — no filter applied (sees all).
 */
export function useCampaignFilter() {
  const { activeCampaignId } = useCampaign();
  if (!activeCampaignId) return {}; // super-admin: no filter
  return { campaign_id: activeCampaignId };
}

/**
 * Returns the active campaign_id to stamp on new records.
 * Returns null for super-admins (they should pick a campaign explicitly).
 */
export function useCampaignId() {
  const { activeCampaignId } = useCampaign();
  return activeCampaignId;
}