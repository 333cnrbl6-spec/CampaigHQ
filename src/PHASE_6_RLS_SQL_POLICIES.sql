-- Phase 6: Row-Level Security (RLS) SQL Policies
-- Deploy in sequence: Enable RLS → Create Policies → Test Verification

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL CAMPAIGN-SCOPED ENTITIES
-- ============================================================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvassing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_interaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaflet_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvassing_shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_signup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: CAMPAIGN ISOLATION POLICIES (Core Multi-Tenancy)
-- ============================================================================

-- All users can SELECT campaigns they own or are members of
CREATE POLICY campaign_member_access ON public.campaigns
  FOR SELECT
  USING (
    owner_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.campaign_members
      WHERE campaign_members.campaign_id = campaigns.id
      AND campaign_members.user_email = current_user_email()
    )
  );

-- All campaign-scoped entities: User must have access to the campaign
CREATE POLICY contact_campaign_access ON public.contact
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM public.campaign_members
        WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_email = current_user_email()
      )
    )
  );

CREATE POLICY turf_campaign_access ON public.turf
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM public.campaign_members
        WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_email = current_user_email()
      )
    )
  );

CREATE POLICY task_campaign_access ON public.task
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM public.campaign_members
        WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_email = current_user_email()
      )
    )
  );

CREATE POLICY campaign_event_campaign_access ON public.campaign_event
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM public.campaign_members
        WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_email = current_user_email()
      )
    )
  );

CREATE POLICY leaflet_run_campaign_access ON public.leaflet_run
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM public.campaign_members
        WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_email = current_user_email()
      )
    )
  );

CREATE POLICY issue_campaign_access ON public.issue
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM public.campaign_members
        WHERE campaign_members.campaign_id = campaigns.id
        AND campaign_members.user_email = current_user_email()
      )
    )
  );

CREATE POLICY canvassing_shift_campaign_access ON public.canvassing_shift
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = (
        SELECT campaign_id FROM public.task 
        WHERE task.id = canvassing_shift.id LIMIT 1
      )
      AND (
        campaigns.owner_email = current_user_email()
        OR EXISTS (
          SELECT 1 FROM public.campaign_members
          WHERE campaign_members.campaign_id = campaigns.id
          AND campaign_members.user_email = current_user_email()
        )
      )
    )
  );

-- ============================================================================
-- SECTION 3: VOLUNTEER SELF-ACCESS POLICIES
-- ============================================================================

-- Volunteers can only see their own profile (organizers see all)
CREATE POLICY volunteer_profile_self_access ON public.volunteer_profile
  FOR SELECT
  USING (
    user_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = current_user_email()
      AND users.role IN ('organizer', 'admin')
    )
  );

-- Volunteers can only see their own location (organizers see all)
CREATE POLICY volunteer_location_self_access ON public.volunteer_location
  FOR SELECT
  USING (
    volunteer_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = current_user_email()
      AND users.role IN ('organizer', 'admin')
    )
  );

-- Volunteers can only see their own canvassing logs (organizers see all)
CREATE POLICY canvassing_log_self_access ON public.canvassing_log
  FOR SELECT
  USING (
    volunteer_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = current_user_email()
      AND users.role IN ('organizer', 'admin')
    )
  );

-- ============================================================================
-- SECTION 4: TURF-BASED CONTACT ACCESS
-- ============================================================================

-- Contacts accessible only if user has turf assignment (organizers bypass)
CREATE POLICY contact_turf_assignment ON public.contact
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.turf
      WHERE turf.id = contact.turf_id
      AND (
        turf.assigned_to = current_user_email()
        OR (turf.assigned_team)::text LIKE '%' || current_user_email() || '%'
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.email = current_user_email()
          AND users.role IN ('organizer', 'admin')
        )
      )
    )
  );

-- Contact interactions: accessible if user can access the contact
CREATE POLICY contact_interaction_access ON public.contact_interaction
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contact
      WHERE contact.id = contact_interaction.contact_id
      AND (
        EXISTS (
          SELECT 1 FROM public.turf
          WHERE turf.id = contact.turf_id
          AND (
            turf.assigned_to = current_user_email()
            OR (turf.assigned_team)::text LIKE '%' || current_user_email() || '%'
            OR EXISTS (
              SELECT 1 FROM public.users
              WHERE users.email = current_user_email()
              AND users.role IN ('organizer', 'admin')
            )
          )
        )
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE users.email = current_user_email()
          AND users.role IN ('organizer', 'admin')
        )
      )
    )
  );

-- ============================================================================
-- SECTION 5: INSERT/UPDATE/DELETE POLICIES
-- ============================================================================

-- Volunteers can create logs for themselves; organizers can create for anyone
CREATE POLICY canvassing_log_insert ON public.canvassing_log
  FOR INSERT
  WITH CHECK (
    volunteer_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = current_user_email()
      AND users.role IN ('organizer', 'admin')
    )
  );

-- Volunteers can log interactions; organizers have full access
CREATE POLICY contact_interaction_insert ON public.contact_interaction
  FOR INSERT
  WITH CHECK (
    logged_by = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = current_user_email()
      AND users.role IN ('organizer', 'admin')
    )
  );

-- Volunteers can update location; organizers have full access
CREATE POLICY volunteer_location_update ON public.volunteer_location
  FOR UPDATE
  USING (
    volunteer_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.email = current_user_email()
      AND users.role IN ('organizer', 'admin')
    )
  );

-- ============================================================================
-- SECTION 6: VERIFICATION QUERIES (Run post-deployment)
-- ============================================================================

-- Test 1: Verify volunteer sees only their own profile
-- SELECT * FROM public.volunteer_profile WHERE user_email != current_user_email();
-- Expected: 0 rows (for non-admin users)

-- Test 2: Verify volunteer sees only assigned turfs' contacts
-- SELECT COUNT(*) FROM public.contact c
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.turf t
--   WHERE t.id = c.turf_id
--   AND (t.assigned_to = current_user_email() OR t.assigned_team::text LIKE '%' || current_user_email() || '%')
-- );
-- Expected: 0 rows (for volunteer users)

-- Test 3: Verify volunteer sees only their own logs
-- SELECT * FROM public.canvassing_log WHERE volunteer_email != current_user_email();
-- Expected: 0 rows (for non-admin users)

-- Test 4: Verify admin sees all data
-- (Switch to admin user and run above queries)
-- Expected: All rows visible

-- ============================================================================
-- NOTES
-- ============================================================================

-- After deploying RLS, backend functions can be simplified:
-- 1. Remove manual authorization checks (RLS enforces automatically)
-- 2. Simplify queries (no need to filter by user/assignment)
-- 3. Keep validation logic for business rules
-- 4. Use base44.asServiceRole only for admin operations

-- Performance Monitoring:
-- Monitor query performance after RLS deployment
-- Add indexes on (campaign_id, user_email) and (turf_id, assigned_to)
-- if needed for large datasets