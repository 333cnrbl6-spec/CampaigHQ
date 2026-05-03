/**
 * Data Isolation Utilities
 * Ensures no data bleed between users/campaigns
 */

import { base44 } from '@/api/base44Client';

/**
 * Safely filter entities by current user email
 * CRITICAL: Always use this for multi-tenant data access
 */
export async function loadUserData(entityName, filters = {}) {
  try {
    const user = await base44.auth.me();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Always append user email filter
    const safeFilters = {
      ...filters,
      created_by: user.email
    };

    const entities = await base44.entities[entityName].filter(safeFilters, '-updated_date', 100);
    return entities;
  } catch (error) {
    console.error(`Failed to load ${entityName}:`, error);
    throw error;
  }
}

/**
 * Ensure a campaign belongs to current user before allowing access
 */
export async function validateCampaignAccess(campaignId) {
  try {
    const user = await base44.auth.me();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const campaign = await base44.entities.Campaign.filter({
      id: campaignId,
      created_by: user.email
    });

    if (!campaign || campaign.length === 0) {
      throw new Error('Campaign not found or access denied');
    }

    return campaign[0];
  } catch (error) {
    console.error('Campaign access validation failed:', error);
    throw error;
  }
}

/**
 * Load only current user's campaign data
 */
export async function loadCurrentUserCampaigns() {
  try {
    return await loadUserData('Campaign');
  } catch (error) {
    console.error('Failed to load campaigns:', error);
    return [];
  }
}

/**
 * Validate that contact belongs to user's campaign
 */
export async function validateContactAccess(contactId, campaignId) {
  try {
    const user = await base44.auth.me();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First verify campaign ownership
    await validateCampaignAccess(campaignId);

    // Then verify contact belongs to that campaign
    const contact = await base44.entities.Contact.filter({
      id: contactId,
      campaign_id: campaignId
    });

    if (!contact || contact.length === 0) {
      throw new Error('Contact not found or access denied');
    }

    return contact[0];
  } catch (error) {
    console.error('Contact access validation failed:', error);
    throw error;
  }
}

export default {
  loadUserData,
  validateCampaignAccess,
  loadCurrentUserCampaigns,
  validateContactAccess
};