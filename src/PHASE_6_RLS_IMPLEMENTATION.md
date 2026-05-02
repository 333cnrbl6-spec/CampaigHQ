# Phase 6: Database-Level Row-Level Security (RLS)

**Status**: Architecture Complete | Implementation Ready

## Overview
Phase 6 transitions security enforcement from application layer (Phases 1-5) to database layer. RLS policies ensure data isolation at the source, preventing unauthorized access even if backend functions are bypassed.

---

## RLS Policy Strategy

### Core Principles
1. **Campaign Isolation**: All records scoped by `campaign_id`
2. **User Ownership**: Volunteer data bound to `user_email` 
3. **Turf Assignment**: Contact access tied to turf assignment
4. **Role-Based Access**: Organizers/admins bypass restrictions

### Policy Categories

#### 1. Campaign Scoping (All Entities)
```sql
CREATE POLICY campaign_isolation
  ON public.{entity}
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT campaign_id FROM campaigns WHERE owner_email = current_user_email()
      OR EXISTS (
        SELECT 1 FROM campaign_members 
        WHERE campaign_id = campaigns.id 
        AND user_email = current_user_email()
      )
    )
  );
```

#### 2. Volunteer Self-Access (Profile, Location, Logs)
```sql
CREATE POLICY self_access_only
  ON public.volunteer_profile
  FOR SELECT
  USING (
    user_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.email = current_user_email()
      AND u.role IN ('organizer', 'admin')
    )
  );
```

#### 3. Turf-Based Contact Access
```sql
CREATE POLICY turf_contact_access
  ON public.contact
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM turf t
      WHERE t.id = contact.turf_id
      AND (
        t.assigned_to = current_user_email()
        OR t.assigned_team::text LIKE '%' || current_user_email() || '%'
        OR EXISTS (
          SELECT 1 FROM users u 
          WHERE u.email = current_user_email()
          AND u.role IN ('organizer', 'admin')
        )
      )
    )
  );
```

#### 4. Log Ownership (Sessions, Interactions)
```sql
CREATE POLICY log_owner_access
  ON public.canvassing_log
  FOR SELECT
  USING (
    volunteer_email = current_user_email()
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.email = current_user_email()
      AND u.role IN ('organizer', 'admin')
    )
  );
```

---

## Implementation Roadmap

### Step 1: Enable RLS on All Entities
```sql
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE turf ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_location ENABLE ROW LEVEL SECURITY;
-- (Apply to all campaign-scoped entities)
```

### Step 2: Deploy Policies
- Campaign isolation policies (all entities)
- Role-based admin bypass policies
- Volunteer self-access policies
- Turf-based contact access policies
- Log ownership policies

### Step 3: Backend Function Updates
Once RLS is active, backend functions can:
- Remove manual authorization checks (redundant)
- Simplify queries (RLS filters automatically)
- Use `base44.asServiceRole` for admin operations that bypass RLS

### Step 4: Testing & Verification
- Cross-volunteer access attempts (should fail)
- Cross-campaign queries (should fail)
- Organizer access (should succeed)
- Self-access requests (should succeed)

---

## Security Verification Checklist

- [ ] All campaign-scoped entities have RLS enabled
- [ ] Campaign isolation policies applied to all entities
- [ ] Volunteer self-access policies prevent cross-volunteer views
- [ ] Turf-based contact policies enforce assignment restrictions
- [ ] Log ownership policies restrict session/interaction visibility
- [ ] Admin bypass policies work correctly
- [ ] Backend functions tested with RLS active
- [ ] Frontend properly handles 403 responses from RLS denials
- [ ] No data leakage in error messages
- [ ] Performance tested with RLS policies active

---

## Migration Path

**Current State (Phase 5)**: Application-layer access control in backend functions.

**Post-Phase 6**: Database-layer RLS enforces policy automatically. Backend functions simplified but retain validation logic.

**Benefits**:
- Defense-in-depth: Security enforced at multiple layers
- API-agnostic: Blocks unauthorized access regardless of client
- Performance: Database optimizes policy enforcement
- Auditability: RLS logs queryable for compliance

---

## Next Steps

1. **Database Preparation**: Work with Base44 ops to enable RLS on campaign entities
2. **Policy Deployment**: Roll out RLS policies in batches (test → staging → production)
3. **Backend Optimization**: Once RLS active, refactor backend functions to simplify authorization (optional, non-breaking)
4. **Load Testing**: Verify RLS performance at scale

---

**Timeline**: RLS deployment can run parallel to Phase 5 completion. No breaking changes to existing APIs.