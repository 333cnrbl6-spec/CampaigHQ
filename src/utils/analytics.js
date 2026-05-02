import { base44 } from '@/api/base44Client';

/**
 * Track user events for analytics
 * Events are automatically logged to the platform
 */
export const analyticsEvents = {
  // Auth & Onboarding
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_SETUP_COMPLETE: 'campaign_setup_complete',
  VOLUNTEER_INVITED: 'volunteer_invited',
  PROFILE_COMPLETED: 'profile_completed',

  // Billing
  BILLING_PAGE_VIEWED: 'billing_page_viewed',
  PLAN_UPGRADED: 'plan_upgraded',
  PLAN_DOWNGRADED: 'plan_downgraded',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  PAYMENT_FAILED: 'payment_failed',

  // Field Operations
  FIELD_MODE_STARTED: 'field_mode_started',
  CONTACT_CANVASSED: 'contact_canvassed',
  SESSION_COMPLETED: 'session_completed',
  WELFARE_CHECKIN: 'welfare_checkin',

  // Data Management
  CONTACTS_IMPORTED: 'contacts_imported',
  TURF_CREATED: 'turf_created',
  VOLUNTEER_ASSIGNED: 'volunteer_assigned',

  // Feature Usage
  REPORT_GENERATED: 'report_generated',
  DATA_EXPORTED: 'data_exported',
  MAP_VIEWED: 'map_viewed',
  LEADERBOARD_VIEWED: 'leaderboard_viewed',

  // Support
  HELP_ARTICLE_VIEWED: 'help_article_viewed',
  SUPPORT_CONTACTED: 'support_contacted',
};

export const trackEvent = async (eventName, properties = {}) => {
  try {
    await base44.analytics.track({
      eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

// Convenience methods for common events
export const analytics = {
  campaignCreated: (data) => trackEvent(analyticsEvents.CAMPAIGN_CREATED, { campaign_name: data.name }),
  planUpgraded: (fromPlan, toPlan) => trackEvent(analyticsEvents.PLAN_UPGRADED, { from_plan: fromPlan, to_plan: toPlan }),
  contactCanvassed: (count) => trackEvent(analyticsEvents.CONTACT_CANVASSED, { contact_count: count }),
  sessionCompleted: (duration, doorsKnocked) => trackEvent(analyticsEvents.SESSION_COMPLETED, { duration_minutes: duration, doors_knocked: doorsKnocked }),
  volunteersAssigned: (count) => trackEvent(analyticsEvents.VOLUNTEER_ASSIGNED, { volunteer_count: count }),
};