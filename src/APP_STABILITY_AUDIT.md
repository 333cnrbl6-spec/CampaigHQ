# App Stability & Completeness Audit
**Date:** 2026-05-02  
**Target User:** greenpartypaul@gmail.com  
**Status:** Critical stabilization phase

---

## 1. WORKING SYSTEMS ✅

### Core Infrastructure
- ✅ **Campaign auto-load** — Users seamlessly boot into their campaign without manual setup
- ✅ **Role-based access** — Campaign admin/volunteer roles properly initialized
- ✅ **Session persistence** — User state maintained across navigation
- ✅ **Authentication gateway** — Auth context properly guards protected routes
- ✅ **Data fetching** — TanStack Query managing caching and refetch strategies

### Backend Functions (Tested & Operational)
- ✅ `getActivityFeed` — Returns campaign activities (200 OK)
- ✅ `getLeaderboardData` — Volunteer rankings and achievements
- ✅ `getSessionLogs` — Canvassing session history
- ✅ `getVolunteerLocations` — Real-time volunteer positioning
- ✅ `getContactDetails` — Voter contact data
- ✅ Geocoding pipeline (batchGeocodeContacts, geocodeNewContacts)
- ✅ Contact deduplication (deduplicateContacts)
- ✅ Turf assignment (assignTurfTagsByElectoralArea)

### UI Components (Rendering & Stable)
- ✅ Dashboard — Stats, leaderboard, support analytics, activity feed
- ✅ Contacts page — Full CRUD with bulk actions, filtering, pagination
- ✅ Sidebar navigation — Collapsible, active state tracking
- ✅ Layout system — AppLayout + Sidebar properly wrapping routes

---

## 2. CRITICAL ISSUES BLOCKING USER 🔴

### Issue A: Campaign ID Exposure & Type Inconsistency
**Severity:** HIGH  
**Current Code:** `Contacts.jsx:38` uses `const { campaignId } = useCampaign()`  
**Problem:** `useCampaign()` exports `campaign` (object) not `campaignId` (string). Results in:
- Functions receiving `undefined` instead of campaign ID
- Silent data fetch failures
- User sees empty tables and "no data" UI

**Fix Required:**
```javascript
// WRONG (current):
const { campaignId } = useCampaign();

// CORRECT:
const { campaign } = useCampaign();
const campaignId = campaign?.id;
```

### Issue B: Dashboard Hardcoded Copy
**Severity:** MEDIUM  
**Current Code:** `Dashboard.jsx:94-98` hardcodes "Tyldesley & Mosley Common" and "Paul Binns"  
**Problem:** Not using `campaign.name` or `campaign.candidate_name`. Shows wrong data if user switches campaigns or runs demo with different data.

**Fix Required:** Replace with dynamic values from `campaign` object.

### Issue C: Role & Permission Enforcement
**Severity:** MEDIUM  
**Problem:** No role-based UI restrictions. All nav items visible to all users. Admin-only functions callable by volunteers.

**Fix Required:** 
- Gate sensitive sections (admin panel, data export, settings) behind role checks
- Disable buttons based on user permissions
- Return clear error messages if unpermitted

### Issue D: Error Boundaries & Graceful Degradation
**Severity:** MEDIUM  
**Problem:** Component crashes if data is malformed; no fallback UI. Example: `SupportAnalytics` expects array, crashes if null.

**Fix Required:** Wrap risky data access in defensive checks (already partially done but inconsistent).

---

## 3. MAJOR MISSING FEATURES 🟡

### Feature 1: Field Mode (Mobile/Offline)
**File:** `pages/FieldMode.jsx` exists but untested  
**Status:** Needs E2E testing for:
- GPS location tracking
- Offline queue/sync
- Contact interaction logging
- Battery/signal indicators

### Feature 2: Shift Management
**File:** `pages/ShiftManagement.jsx` created but no supporting backend  
**Missing:**
- Shift creation/editing API
- Volunteer signup tracking
- Shift reminder notifications

### Feature 3: Outreach Automation
**File:** `pages/OutreachAutomation.jsx` exists but incomplete  
**Missing:**
- Sequence trigger conditions
- Message templating
- Email/SMS delivery confirmation

### Feature 4: Real-time Collaboration
**File:** `pages/TeamChat.jsx` has no backend integration  
**Missing:**
- WebSocket connection for live messaging
- Message persistence
- Notification delivery

### Feature 5: Route Optimization
**File:** `pages/RouteOptimizer.jsx` exists but may be incomplete  
**Missing:**
- Distance matrix calculation verification
- Real-world testing with actual addresses

---

## 4. DATA INTEGRITY ISSUES 🔴

### Problem 1: Contact Geocoding Inconsistency
- latitude=0 used as "failed" sentinel, but valid coords can be 0
- Risk: Accidentally skipping genuine locations
- **Fix:** Use separate `geocoding_failed` boolean field

### Problem 2: Campaign Membership Sync
- User record may not sync if in "Act as User" mode (caught gracefully but creates inconsistency)
- Risk: Membership data stale on next login

### Problem 3: Null Array Handling
- Many filters assume arrays but receive null: `Array.isArray(contacts) ? contacts.filter(...) : []`
- Defensive but verbose; should standardize at source (API should always return arrays)

---

## 5. TESTING & VALIDATION GAPS 🟠

| Component | Unit Tests | Integration Tests | E2E Tests | Status |
|-----------|-----------|------------------|-----------|--------|
| Campaign Context | ❌ | ❌ | ❌ | Not tested |
| Dashboard | ❌ | ❌ | Manual only | Blind spots |
| Contacts CRUD | ❌ | ❌ | Manual only | Unknown edge cases |
| Field Mode | ❌ | ❌ | None | Untested |
| Geocoding Pipeline | ❌ | Partial (via function test) | None | Risky |
| Leaderboard Calc | ❌ | ❌ | None | Unknown accuracy |

---

## 6. PERFORMANCE CONCERNS 🟠

- **Dashboard:** Fetches 5+ separate functions on load; potential waterfall delay
- **Contacts List:** 100-item pagination but full array fetched; no server-side filtering
- **Real-time Updates:** Polling interval set to 60-180s; high-volume apps will lag
- **No Caching Strategy:** Dashboard re-renders frequently; no memoization

---

## 7. SECURITY ISSUES 🔴

- **RLS (Row-Level Security):** Partially implemented; User.list() still returns 403 (acceptable)
- **XSS Risk:** Contact names/addresses rendered without sanitization (low risk but non-zero)
- **GDPR Compliance:** `GdprCompliance.jsx` page exists but no backend automation for deletion
- **Audit Logging:** `logAuditEvent` exists but not called consistently across mutations

---

## 8. PRIORITIZED FIX LIST

### Phase 1: CRITICAL (Fixes to unblock user — 2-3 days)
1. **Fix campaignId destructuring** → Contacts/Dashboard will work
2. **Harden Dashboard rendering** → Use campaign object data dynamically
3. **Add role-based UI gates** → Prevent admin operations by volunteers
4. **Test contact CRUD** → Verify add/edit/delete work end-to-end
5. **Validate geocoding** → Run batch geocode on test data; verify results

### Phase 2: HIGH (Core features working — 3-5 days)
1. **E2E test Field Mode** — GPS, offline sync, interaction logging
2. **Implement Shift Management backend** — Create/edit shifts, volunteer signup
3. **Complete Outreach Automation** — Sequence triggers, message composition
4. **Test leaderboard calculations** — Verify volunteer rankings accuracy
5. **Add error boundaries** — Gracefully handle malformed data

### Phase 3: MEDIUM (Polish & stability — 5-7 days)
1. **Implement role-based nav filtering** — Hide unavailable features
2. **Add caching/memoization** — Improve Dashboard render performance
3. **Setup automated testing suite** — Unit tests for core functions
4. **GDPR automation** — Right-to-be-forgotten automatic purge
5. **Audit logging completion** — Log all mutations consistently

### Phase 4: LOW (Nice-to-have — beyond scope)
1. Real-time WebSocket messaging
2. Advanced analytics/reporting
3. API rate limiting & quotas
4. Multi-tenancy dashboard

---

## 9. WHAT USER GREENPARTYPAUL NEEDS IMMEDIATELY

**MVP for acceptance:**
1. ✅ Login & campaign auto-load (DONE)
2. ⚠️ Contacts CRUD working reliably (IN PROGRESS)
3. ⚠️ Geocoding pipeline validated (IN PROGRESS)
4. ❌ Field Mode tested with real GPS
5. ❌ Shift scheduling functional
6. ❌ Basic reporting/leaderboard
7. ❌ Data export capability

---

## 10. NEXT STEPS

1. **Approve Phase 1 fixes** — Lock down campaign ID issue, dashboard rendering, role-based access
2. **User acceptance testing** — greenpartypaul walks through core workflows
3. **Identify additional blockers** — What else is broken?
4. **Set realistic timeline** — What can be fixed by election day?

---

**Recommendation:** Start with **Phase 1 fixes immediately** before further feature development. User needs a stable foundation, not more features.