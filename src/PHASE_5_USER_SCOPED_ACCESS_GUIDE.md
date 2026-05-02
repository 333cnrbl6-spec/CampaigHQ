# Phase 5: User-Scoped Access Control & Volunteer Isolation

**Status:** 📋 **PLANNING** — User-level data isolation strategy

**Goal:** Restrict volunteers and team members to only their own data, assigned turfs, and shift-related contacts.

---

## Architecture Overview

### Layer 1: Campaign-Scoped (Phase 4 ✅)
- All backend functions filter by `campaign_id`
- No cross-campaign data access at API level
- User must belong to Campaign A to access Campaign A data

### Layer 2: User-Scoped (Phase 5 — THIS PHASE)
- Volunteers see only their assigned turfs, shifts, and contacts
- Team leads see their volunteers' data
- Organizers see all campaign data
- Users cannot query or update data outside their scope

### Layer 3: RLS Enforcement (Phase 6)
- Database-level Row-Level Security policies
- Final security layer — backend filtering + RLS
- Prevents SQL injection or direct database access

---

## User Roles & Access Patterns

### Volunteer (role: "user")
- View own profile
- View assigned turfs only
- View contacts in assigned turfs only
- Log interactions on assigned turfs
- View own session logs
- Cannot view other volunteers' data

### Team Lead (role: "team_lead")
- View own profile
- View assigned volunteers' data
- View assigned volunteers' session logs
- View turfs assigned to their team
- Cannot modify organizer-level settings

### Organizer (role: "organizer")
- Full campaign access
- View all volunteers, turfs, contacts
- Manage team structure
- Export data, run analytics

### Admin (role: "admin")
- Cross-campaign access
- System-wide management
- No restrictions

---

## Implementation Strategy

### Phase 5a: Authorization Middleware
- Create reusable auth check functions
- Implement role-based access patterns
- Document scope validation logic

### Phase 5b: Volunteer Profile Isolation
- Verify user can only see/edit own `VolunteerProfile`
- Restrict team lead assignments
- Lock down location sharing consent

### Phase 5c: Turf & Contact Filtering
- Verify volunteer can only see assigned turfs
- Verify volunteer can only see contacts in assigned turfs
- Filter by `user_email` + assigned turf context

### Phase 5d: Session & Log Isolation
- Verify session logs belong to user
- Filter CanvassingLog by session owner
- Restrict volunteer interaction history to own actions

### Phase 5e: Frontend Implementation
- Query caching by user scope
- Prevent frontend calls to unauthorized endpoints
- Graceful error handling for permission violations

---

## Functions Requiring User-Scoped Updates

### Group A: Volunteer Profile & Assignment
1. **updateVolunteerProfile** (NEW)
   - Allow volunteer to update own profile only
   - Owner validation: `user.email === volunteer.user_email`

2. **getVolunteerAssignments** (NEW)
   - Return turfs/shifts assigned to volunteer
   - Filter: `assigned_to === user.email`

3. **volunteersForShift** (MODIFY existing)
   - Show only current user's signup if volunteer
   - Show all signups if organizer+

### Group B: Turf & Contact Viewing
4. **getAssignedTurfs** (NEW)
   - Return turfs assigned to user
   - Filter: `assigned_to === user.email` OR `assigned_team` contains user

5. **getContactsForTurf** (MODIFY existing)
   - Check if user has access to turf
   - Return contacts only if authorized

6. **getContactDetails** (MODIFY existing)
   - Verify contact is in user's assigned turfs
   - Deny access if contact outside scope

### Group C: Session & Log Management
7. **logCanvassingSession** (MODIFY existing)
   - Auto-set `volunteer_email` from current user
   - Prevent spoofing another volunteer

8. **getSessionLog** (NEW)
   - Return own session logs only (unless team lead/organizer)
   - Filter by `volunteer_email === user.email`

9. **updateInteractionLog** (MODIFY existing)
   - Only allow volunteer to update own interactions
   - Verify interaction was logged by current user

### Group D: Shift Management
10. **signupForShift** (MODIFY existing)
    - Allow self-signup only
    - Auto-populate `volunteer_email` from user

11. **updateShiftSignup** (MODIFY existing)
    - Volunteer can only update own signup
    - Organizer can update any

---

## Authorization Patterns

### Pattern 1: Self-Access Only (Volunteer Profile)
```javascript
const user = await base44.auth.me();
const profile = await base44.asServiceRole.entities.VolunteerProfile.get(profileId);

if (user.email !== profile.user_email && user.role !== 'organizer') {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

// Proceed with update...
```

### Pattern 2: Assigned Resource (Turf/Contacts)
```javascript
const user = await base44.auth.me();
const contact = await base44.asServiceRole.entities.Contact.get(contactId);
const turf = await base44.asServiceRole.entities.Turf.get(contact.turf_id);

const userIsAssigned = turf.assigned_to === user.email ||
                       turf.assigned_team?.includes(user.email);

if (!userIsAssigned && user.role !== 'organizer') {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

// Proceed...
```

### Pattern 3: Team Lead Delegation
```javascript
const user = await base44.auth.me();
const volunteer = await base44.asServiceRole.entities.VolunteerProfile.get(volunteerId);

const canManage = user.email === volunteer.team_lead_email ||
                  user.role === 'organizer';

if (!canManage) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}

// Proceed...
```

---

## Testing Checklist

### Volunteer Access Tests
- [ ] Volunteer can view own profile
- [ ] Volunteer CANNOT view other volunteer profiles
- [ ] Volunteer can view assigned turfs
- [ ] Volunteer CANNOT view unassigned turfs
- [ ] Volunteer can view contacts in assigned turfs
- [ ] Volunteer CANNOT view contacts outside assigned turfs
- [ ] Volunteer can log own sessions
- [ ] Volunteer CANNOT log sessions for others
- [ ] Volunteer can signup for shifts
- [ ] Volunteer CANNOT signup others

### Team Lead Access Tests
- [ ] Team lead can view assigned volunteers
- [ ] Team lead CANNOT view unassigned volunteers
- [ ] Team lead can view assigned volunteer logs
- [ ] Team lead can view turfs assigned to their team
- [ ] Team lead CANNOT modify organizer settings

### Organizer Access Tests
- [ ] Organizer can view all volunteers
- [ ] Organizer can view all turfs
- [ ] Organizer can export all data
- [ ] Organizer can modify campaign settings

### Admin Access Tests
- [ ] Admin can access all campaigns
- [ ] Admin can view all user data
- [ ] Admin can impersonate users for debugging

---

## Rollout Timeline

**Week 1:** Phase 5a-5b — Authorization layer + volunteer profile isolation
**Week 2:** Phase 5c — Turf & contact filtering
**Week 3:** Phase 5d — Session & log isolation
**Week 4:** Phase 5e — Frontend integration & testing

---

## Success Criteria

✅ Volunteers cannot access other volunteers' profiles
✅ Volunteers cannot see unassigned turfs
✅ Volunteers cannot see contacts outside assigned turfs
✅ Team leads can manage only their assigned volunteers
✅ Organizers have full campaign visibility
✅ All access violations return 403 Forbidden
✅ Audit logs track authorization failures
✅ No data leakage through error messages

---

## Related Documentation

- [Phase 3: Frontend Isolation](./PHASE_3_COMPLETION_SUMMARY.md)
- [Phase 4: Backend Filtering](./PHASE_4_FUNCTION_UPDATES_CHECKLIST.md)
- [Phase 6: RLS Enforcement](./PHASE_6_RLS_ENFORCEMENT.md) (TBD)
- [Multi-Tenancy Guide](./MULTI_TENANCY_GUIDE.md)