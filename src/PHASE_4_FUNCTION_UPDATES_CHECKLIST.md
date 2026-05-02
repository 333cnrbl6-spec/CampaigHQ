# Phase 4: Backend Function Campaign Filtering Checklist

**Status:** 🔧 **IN PROGRESS** — 4/31 functions updated

---

## Priority 1: Critical Functions (Data-Writing, Multi-Record)

### ✅ COMPLETED

1. **batchGeocodeContacts** ✅
   - Status: Updated
   - Changes: Accept `campaign_id`, filter contacts before geocoding
   - Testing: Run with campaign context

2. **deduplicateContacts** ✅
   - Status: Updated
   - Changes: Require `campaign_id`, filter by campaign_id
   - Testing: Verify duplicates only within campaign

3. **importVoterList** ✅
   - Status: Updated
   - Changes: Require `campaign_id`, inject into batch creates, log campaign_id
   - Testing: Import list into Campaign A, verify Campaign B cannot see

4. **exportCampaignData** ✅
   - Status: Updated
   - Changes: Enhanced validation for admin bypass, added admin logging
   - Testing: Non-admin can't export all, admin can log as needed

### ⏳ PENDING

5. **importTMCExcel**
   - Description: Parse legacy TMC Excel turf files
   - Fix needed: Accept `campaign_id`, inject into created turfs
   - Estimate: 15 min

6. **syncTurfContactCounts**
   - Description: Count contacts per turf
   - Fix needed: Accept `campaign_id`, filter turfs and contacts
   - Estimate: 15 min

7. **generateDailyRouteBatches**
   - Description: Create daily canvassing route assignments
   - Fix needed: Accept `campaign_id`, filter turfs/contacts/volunteers
   - Estimate: 20 min

---

## Priority 2: Reporting & Analytics Functions

### ⏳ PENDING

8. **analyzeCanvassingPatterns**
   - Description: Analyze voter sentiment trends
   - Fix needed: Accept `campaign_id`, filter interactions/contacts
   - Estimate: 20 min

9. **calculateVolunteerAchievements**
   - Description: Calculate volunteer gamification metrics
   - Fix needed: Accept `campaign_id`, filter logs by campaign
   - Estimate: 15 min

10. **generateWeeklySummary**
    - Description: Generate weekly performance report
    - Fix needed: Accept `campaign_id`, filter all queries
    - Estimate: 20 min

11. **generateCanvassingScript**
    - Description: Generate door-knock scripts based on issues
    - Fix needed: Accept `campaign_id`, filter issues/policies
    - Estimate: 15 min

---

## Priority 3: Outreach & Automation Functions

### ⏳ PENDING

12. **deliverOutreachMessages**
    - Description: Send SMS/email from outreach sequences
    - Fix needed: Accept `campaign_id`, filter sequences/contacts
    - Estimate: 20 min

13. **processOutreachSequences**
    - Description: Trigger outreach automation workflows
    - Fix needed: Accept `campaign_id`, filter sequences
    - Estimate: 15 min

14. **triggerOutreachSequence**
    - Description: Manually trigger sequence for contact
    - Fix needed: Accept `campaign_id`, verify contact belongs to campaign
    - Estimate: 10 min

15. **sendBulkEmail**
    - Description: Send bulk email to contact list
    - Fix needed: Accept `campaign_id`, filter contacts
    - Estimate: 15 min

16. **sendDailyVolunteerSummary**
    - Description: Send daily stats to volunteers
    - Fix needed: Accept `campaign_id`, filter logs/interactions
    - Estimate: 15 min

---

## Priority 4: Utility & Maintenance Functions

### ⏳ PENDING

17. **updateVolunteerLocation**
    - Description: Update volunteer GPS location during session
    - Fix needed: Accept `campaign_id`, verify session belongs to campaign
    - Estimate: 10 min

18. **assignRouteBatchToVolunteer**
    - Description: Assign pre-planned route batch to volunteer
    - Fix needed: Accept `campaign_id`, verify batch/volunteer belong to campaign
    - Estimate: 15 min

19. **optimizeCanvassingRoute**
    - Description: Optimize walking route for efficiency
    - Fix needed: Accept `campaign_id`, filter contacts in area
    - Estimate: 15 min

20. **reprocessImportsForTurfTags**
    - Description: Re-apply turf tags to imported contacts
    - Fix needed: Accept `campaign_id`, filter contacts/turfs
    - Estimate: 15 min

21. **geocodeNewContacts**
    - Description: Geocode new contacts on creation
    - Fix needed: Already campaign-scoped via trigger? Verify.
    - Estimate: 10 min

22. **populateWardContacts**
    - Description: Populate initial contact list from electoral roll
    - Fix needed: Accept `campaign_id`, inject into batch creates
    - Estimate: 15 min

23. **assignTurfTagsByElectoralArea**
    - Description: Bulk-assign turf tags based on electoral geometry
    - Fix needed: Accept `campaign_id`, filter turfs/tags
    - Estimate: 15 min

24. **extractTurfGeoFromDocx**
    - Description: Parse legacy DOCX turf boundary descriptions
    - Fix needed: Accept `campaign_id`, inject into created turfs
    - Estimate: 10 min

25. **parseLegacyMapFile**
    - Description: Parse old map files for geo data
    - Fix needed: Accept `campaign_id`, inject into created entities
    - Estimate: 10 min

---

## Priority 5: Automation & Connector Functions

### ⏳ PENDING

26. **deliverScheduledMessages**
    - Description: Send scheduled outreach messages
    - Fix needed: Accept `campaign_id`, filter sequences
    - Estimate: 15 min

27. **manageCampaignMembers**
    - Description: Invite/remove team members
    - Fix needed: Verify campaign ownership before allowing changes
    - Estimate: 10 min

28. **triggerHardRefresh**
    - Description: Force client-side cache refresh
    - Fix needed: System-wide utility, no campaign filter needed
    - Estimate: 0 min (no change)

---

## Priority 6: Admin & Reporting (Lower Priority)

### ⏳ PENDING

29. **generateRoutePDF**
    - Description: Generate printable route PDFs
    - Fix needed: Accept `campaign_id`, filter contacts/turfs
    - Estimate: 15 min

30. **surveyAnalysis** (if exists)
    - Description: TBD
    - Fix needed: TBD
    - Estimate: TBD

31. **reportGeneration** (if exists)
    - Description: TBD
    - Fix needed: TBD
    - Estimate: TBD

---

## Standard Update Pattern

For each function, apply:

```javascript
// 1. Accept campaign_id from request body
const body = await req.json();
const { campaign_id } = body;

// 2. Validate campaign_id for non-admins
if (!campaign_id && user.role !== 'admin') {
  return Response.json({ error: 'campaign_id is required' }, { status: 400 });
}

// 3. Replace list() with filter()
// OLD: const records = await base44.asServiceRole.entities.Entity.list('field', 1000);
// NEW: const records = await base44.asServiceRole.entities.Entity.filter({ campaign_id }, 'field', 1000);

// 4. Inject campaign_id into creates
// OLD: await base44.asServiceRole.entities.Entity.create(data);
// NEW: await base44.asServiceRole.entities.Entity.create({ ...data, campaign_id });
```

---

## Testing Checklist

For each function, verify:

- [ ] Function accepts `campaign_id` parameter
- [ ] Non-admin users cannot call without `campaign_id`
- [ ] Admins can call without `campaign_id` (returns all records)
- [ ] Querying Campaign A data in Campaign B context fails
- [ ] Created records include `campaign_id` field
- [ ] No accidental data leakage between campaigns

---

## Rollout Timeline

**Week 1:** Priority 1 (6 functions)
**Week 2:** Priority 2-3 (10 functions)
**Week 3:** Priority 4-5 (10 functions)
**Week 4:** Testing & validation

---

## Success Criteria

✅ All 31 functions accept and validate `campaign_id` parameter
✅ All `.list()` calls replaced with `.filter({ campaign_id })`
✅ All creates include `campaign_id` in payload
✅ Admin functions still work unrestricted
✅ Integration tests confirm data isolation
✅ No performance regression from filtering

---

## Notes

- Functions like `triggerHardRefresh` are system-wide utilities and don't need campaign filtering
- Some functions may be deprecated or renamed — verify list completeness
- Test with both single-campaign and multi-campaign user scenarios
- Monitor API logs for cross-campaign access attempts (should fail with RLS)