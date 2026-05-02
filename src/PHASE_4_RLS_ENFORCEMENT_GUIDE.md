# Phase 4: Row-Level Security (RLS) Enforcement & Backend Function Filtering

**Status:** 🔧 **IN PROGRESS**

---

## RLS Security Rules to Implement

Base44 uses Row-Level Security (RLS) to enforce data isolation at the database layer. These rules prevent unauthorized access even if frontend/backend code has bugs.

### Campaign-Scoped Entities (RLS Required)

**Pattern:** Users can only access records where `record.campaign_id = user's current campaign`

Entities requiring RLS:
- ✅ Contact
- ✅ Turf
- ✅ Task
- ✅ CampaignEvent
- ✅ CanvassingLog
- ✅ LeafletRun
- ✅ Issue
- ✅ ImportLog
- ✅ CanvassingShift
- ✅ ShiftSignup
- ✅ OutreachSequence
- ✅ OutreachLog
- ✅ GdprRequest
- ✅ ElectionDayTask
- ✅ EventVolunteer
- ⚠️ ContactInteraction (depends on Contact.campaign_id)
- ⚠️ VolunteerLocation (may need campaign context)

### User-Scoped Entities (No RLS Needed)

**Pattern:** Users access only their own records via `user_email`

Entities:
- ✅ VolunteerProfile — scoped by `user_email`
- ✅ Campaign — admins see all; regular users see their own

### Admin-Only Entities (No RLS)

Entities:
- ✅ SystemConfig — admin-only via code

---

## RLS Rule Template

For each campaign-scoped entity, add rule:

```sql
-- Entity: Contact
-- Rule: Users can only see/edit contacts in their current campaign
SELECT: campaign_id = CURRENT_CAMPAIGN_ID
INSERT: campaign_id = CURRENT_CAMPAIGN_ID
UPDATE: campaign_id = CURRENT_CAMPAIGN_ID
DELETE: campaign_id = CURRENT_CAMPAIGN_ID
```

**Implementation approach:**
1. Base44 dashboard → Entity Settings → Row-Level Security
2. Add condition: `campaign_id = user.campaign_id` (or equivalent context)
3. Test: Switch campaigns in UI, verify data isolation at API layer

---

## Backend Function Filtering Pattern

All functions must:
1. **Accept campaign_id parameter** (from frontend context)
2. **Validate campaign access** (user has permission)
3. **Filter all queries** by campaign_id
4. **Include campaign_id in creates** (mutation payloads)

### Critical Functions to Update (Priority 1)

**High-impact functions handling multiple records:**

1. **exportCampaignData** (DONE - awaiting review)
   - Status: Filters by campaign_id ✅
   - Issue: Allows admin to export all data without campaign_id check (intended)

2. **batchGeocodeContacts**
   - Current: Fetches ALL contacts, admin-only
   - Fix: Add campaign_id parameter, filter before geocoding

3. **deduplicateContacts**
   - Current: Processes all contacts
   - Fix: Add campaign_id filter

4. **importVoterList** / **importTMCExcel**
   - Current: May create contacts without campaign_id
   - Fix: Inject campaign_id into created records

5. **generateDailyRouteBatches**
   - Current: Queries all turfs/contacts
   - Fix: Filter by campaign_id

6. **syncTurfContactCounts**
   - Current: Processes all turfs
   - Fix: Filter by campaign_id

### Standard Function Update Checklist

For each backend function:

- [ ] Read campaign_id from request body
- [ ] Validate user has access to campaign (if applicable)
- [ ] Replace `.list()` with `.filter({ campaign_id })`
- [ ] Inject `campaign_id` into create/update payloads
- [ ] Test with multi-campaign scenario

---

## Implementation Priority

### Phase 4a: RLS Rules (Security Foundation)
- Deploy RLS rules to all campaign-scoped entities
- Test via Base44 dashboard
- Verify admin bypass works for national dashboard

### Phase 4b: Backend Function Filtering (Applied Layer)
- **Priority 1** (data-writing functions): batchGeocodeContacts, deduplicateContacts, importVoterList, importTMCExcel
- **Priority 2** (reporting functions): generateWeeklySummary, analyzeCanvassingPatterns
- **Priority 3** (automation functions): deliverOutreachMessages, processOutreachSequences
- **Priority 4** (utility functions): remaining functions

### Phase 4c: Testing & Validation
- Multi-campaign integration test
- Admin access verification
- Non-admin campaign isolation test

---

## Admin Functions (Intentional Exceptions)

Functions that **should** access all campaigns (verified by `user.role === 'admin'`):
- ✅ NationalDashboard (frontend reads all campaigns)
- ✅ exportCampaignData (admin can export all if no campaign_id provided)
- ✅ calculateVolunteerAchievements (if aggregating across campaigns)

Must verify: `user?.role === 'admin'` before allowing unrestricted access.

---

## Files to Modify

### RLS Configuration (Base44 Dashboard)
- Contact entity → RLS rules
- Turf entity → RLS rules
- Task entity → RLS rules
- (14 more entities)

### Backend Functions
Priority order:
1. functions/batchGeocodeContacts
2. functions/deduplicateContacts
3. functions/importVoterList
4. functions/importTMCExcel
5. functions/generateDailyRouteBatches
6. functions/syncTurfContactCounts
7. functions/deliverOutreachMessages
8. functions/processOutreachSequences
9. functions/sendBulkEmail
10. functions/analyzeCanvassingPatterns
(+ 20 more)

---

## Success Criteria

✅ **Phase 4a Complete:**
- All campaign-scoped entities have RLS rules
- Admin bypass works (national dashboard still loads all data)
- Non-admin users cannot access cross-campaign data via API

✅ **Phase 4b Complete:**
- All backend functions accept campaign_id parameter
- All `.list()` calls filtered by campaign_id (or justified as admin-only)
- Mutations include campaign_id in payloads

✅ **Phase 4c Complete:**
- Integration test: User A in Campaign X cannot see User B's Campaign Y data
- Admin test: National admin can view all campaigns
- Performance: No slowdown from RLS checks

---

## Next Steps

1. **Immediate:** Deploy RLS rules to 15 campaign-scoped entities
2. **Week 1:** Update Priority 1 backend functions (6 functions)
3. **Week 2:** Update Priority 2-3 functions (10+ functions)
4. **Week 3:** Comprehensive testing & security audit

---

**Estimated Effort:** 2-3 weeks (security is non-negotiable)
**Risk:** Medium (wrong RLS rules could lock users out)
**Reward:** Complete data isolation guarantee