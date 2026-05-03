# 🧪 Comprehensive Pre-Release Testing Guide
## Green Party Campaign Platform - Deep Dive Testing Checklist

### How to Use This Guide
Copy each section below and test systematically. Report any issues found with:
- **Step**: Where it happened
- **Action**: What you did
- **Expected**: What should happen
- **Actual**: What actually happened
- **Impact**: Critical / High / Medium / Low

---

## 1️⃣ AUTHENTICATION & ONBOARDING
- [ ] Sign up with email
- [ ] Verify email confirmation works
- [ ] Login with valid credentials
- [ ] Login with wrong password (error handling)
- [ ] Login with non-existent email (error handling)
- [ ] Navigate to CampaignSetup page (should appear if no campaign)
- [ ] Create a new campaign as organizer
- [ ] Join campaign as volunteer with invite code
- [ ] Try invalid invite code (error handling)
- [ ] Session persistence (refresh page, still logged in)
- [ ] Logout and verify redirected to login

---

## 2️⃣ CAMPAIGN CREATION & SETUP
- [ ] All required fields are marked with *
- [ ] Campaign name validation (empty, special chars, length)
- [ ] Candidate name field works
- [ ] Party selection dropdown functions
- [ ] Constituency/area autocomplete/input works
- [ ] Election date picker is accessible
- [ ] Target votes input accepts numbers only
- [ ] Submit creates campaign without errors
- [ ] Redirect to dashboard after creation
- [ ] Campaign appears in campaign switcher

---

## 3️⃣ VOLUNTEER PROFILE SETUP
- [ ] Each step validates before allowing next
- [ ] Full name field stores correctly
- [ ] Phone number format validation
- [ ] Emergency contact fields required on step 2
- [ ] Location consent checkbox toggles
- [ ] GDPR consent checkbox prevents submission if unchecked
- [ ] Availability pills toggle on/off
- [ ] Area preferences multiple selections work
- [ ] Languages can be added/removed
- [ ] Vehicle checkbox toggles
- [ ] Profile saves successfully
- [ ] Profile can be edited after creation
- [ ] Profile summary displays all saved data correctly

---

## 4️⃣ CONTACTS MANAGEMENT
- [ ] Load contacts list (check loading state)
- [ ] Search by name filters correctly
- [ ] Filter by support level works
- [ ] Filter by canvassed status works
- [ ] Sort by name, date, support level
- [ ] Create new contact with required fields
- [ ] Create contact with optional fields
- [ ] Edit existing contact
- [ ] Delete contact (with confirmation)
- [ ] Bulk tag contacts
- [ ] Contact interaction history loads
- [ ] Map view renders with location data
- [ ] Contact form validation (empty required fields)
- [ ] Phone number format validation
- [ ] Email format validation
- [ ] Support level enum restricted to valid options
- [ ] Tags field accepts multiple values

---

## 5️⃣ CANVASSING WORKFLOW
- [ ] Open Field Mode
- [ ] Select assigned turf
- [ ] Contact list loads for turf
- [ ] Mobile contact card displays clearly
- [ ] Record interaction (door knock, call, etc)
- [ ] Support level selection updates contact
- [ ] Notes field accepts text
- [ ] Log interaction saves without error
- [ ] Interaction appears in contact history
- [ ] Welfare location tracking (if enabled)
- [ ] Offline mode caches interactions
- [ ] Interactions sync when online

---

## 6️⃣ REPORTS & DATA EXPORT
- [ ] Reports page loads
- [ ] Select report template
- [ ] Generate PDF without errors
- [ ] PDF downloads to device
- [ ] PDF contains expected data
- [ ] Charts render correctly
- [ ] No console errors during generation
- [ ] Export data button works
- [ ] CSV file downloads correctly
- [ ] CSV contains all contact fields

---

## 7️⃣ TURF MANAGEMENT
- [ ] Turf list displays all turfs
- [ ] Draw new turf boundary on map
- [ ] Edit existing turf boundary
- [ ] Assign turf to volunteer
- [ ] Bulk assign turfs to team
- [ ] Turf status transitions (unassigned → assigned → in_progress → completed)
- [ ] Priority flag (normal/high/urgent)
- [ ] Contact density heatmap renders
- [ ] Walking route optimizer generates routes
- [ ] Route PDF exports correctly

---

## 8️⃣ TASK MANAGEMENT
- [ ] Create task with title, description
- [ ] Set priority (high/medium/low)
- [ ] Set due date with date picker
- [ ] Assign to volunteer
- [ ] Change status (todo → in_progress → done)
- [ ] Filter tasks by status
- [ ] Filter tasks by priority
- [ ] Delete task with confirmation
- [ ] Edit task fields
- [ ] No date validation errors

---

## 9️⃣ EVENTS & SHIFTS
- [ ] Create event with title, date, time
- [ ] Event types dropdown works (canvassing, hustings, etc)
- [ ] Set location
- [ ] Add description
- [ ] Volunteer can sign up for shift
- [ ] Shift signup saves correctly
- [ ] Event shows signup count
- [ ] Event status transitions correctly
- [ ] Delete event with confirmation
- [ ] Events appear in volunteer calendar

---

## 1️⃣0️⃣ LEADERBOARD & GAMIFICATION
- [ ] Leaderboard loads volunteer data
- [ ] Sort by doors knocked
- [ ] Sort by positive responses
- [ ] Sort by leaflets delivered
- [ ] Achievements display correctly
- [ ] Points calculation is accurate
- [ ] Rank badges show correctly
- [ ] No private data exposed in leaderboard

---

## 1️⃣1️⃣ GDPR & COMPLIANCE
- [ ] Right to be forgotten request creates record
- [ ] Data access report generates correctly
- [ ] Consent logs are maintained
- [ ] Deletion requested contacts marked correctly
- [ ] Audit log entries created for all actions
- [ ] No unauthorized data access
- [ ] Data retention policy enforced
- [ ] Consent dates recorded

---

## 1️⃣2️⃣ BILLING & SUBSCRIPTION
- [ ] Pricing page loads correctly
- [ ] Plan comparison displays
- [ ] Toggle monthly/annual pricing
- [ ] Checkout button redirects to Stripe
- [ ] Test card 4242 4242 4242 4242 processes
- [ ] Payment success creates subscription
- [ ] Subscription status updates
- [ ] Invoice generated and emailed
- [ ] Trial countdown displayed
- [ ] Trial expiry email sent
- [ ] Plan upgrade/downgrade works
- [ ] Usage metrics tracked

---

## 1️⃣3️⃣ PERFORMANCE & RESPONSIVENESS
- [ ] Page load times < 3 seconds
- [ ] Mobile viewport scales correctly
- [ ] Buttons touch-friendly (48px min)
- [ ] Forms accessible on mobile
- [ ] Maps render smoothly with large datasets
- [ ] No layout shift on image load
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No console warnings/errors
- [ ] Network requests reasonable count
- [ ] API response times < 1 second

---

## 1️⃣4️⃣ DATA CONSISTENCY
- [ ] Contact created in one view appears in another
- [ ] Turf updates reflect immediately
- [ ] Task status changes sync
- [ ] Volunteer profile updates visible everywhere
- [ ] Real-time subscriptions work (if implemented)
- [ ] No stale data cached
- [ ] Deleted records removed immediately
- [ ] Bulk updates complete successfully

---

## 1️⃣5️⃣ ERROR HANDLING
- [ ] Network error shows retry option
- [ ] Permission denied shows helpful message
- [ ] Validation errors highlighted clearly
- [ ] Required fields have indicators
- [ ] Form errors prevent submission
- [ ] Error messages are specific (not "Error")
- [ ] 404 pages render (PageNotFound)
- [ ] No blank/white screens on error

---

## 1️⃣6️⃣ NAVIGATION & ROUTING
- [ ] All sidebar links work
- [ ] Back button works correctly
- [ ] Deep links work (direct URL access)
- [ ] Redirect loops don't occur
- [ ] Protected routes require auth
- [ ] Admin routes check permissions
- [ ] Breadcrumbs (if present) work
- [ ] No broken internal links

---

## 1️⃣7️⃣ REAL-TIME DATA
- [ ] Live volunteer map updates
- [ ] Activity feed updates without refresh
- [ ] Location tracking works in Field Mode
- [ ] Welfare alerts trigger
- [ ] Chat messages appear immediately
- [ ] Interactions sync to contacts

---

## 1️⃣8️⃣ EDGE CASES
- [ ] Create contact with special characters in name
- [ ] Long text in description fields
- [ ] Empty state screens (no data)
- [ ] Pagination with large datasets (1000+ records)
- [ ] Search with no results
- [ ] Filter with no matches
- [ ] Delete last item in list
- [ ] Bulk operations on selected items

---

## 1️⃣9️⃣ CROSS-BROWSER / DEVICES
- [ ] Chrome desktop
- [ ] Firefox desktop
- [ ] Safari desktop
- [ ] Chrome mobile
- [ ] Safari mobile
- [ ] Tablet portrait
- [ ] Tablet landscape

---

## 2️⃣0️⃣ ACCESSIBILITY (WCAG 2.1)
- [ ] Color contrast ratios meet WCAG AA
- [ ] Focus indicators visible
- [ ] Form labels associated with inputs
- [ ] ARIA labels present where needed
- [ ] Images have alt text
- [ ] Keyboard-only navigation possible
- [ ] No flashing content (seizure risk)
- [ ] Skip to main content link works
- [ ] Screen reader compatible headings

---

## Issue Reporting Format
When you find an issue, note:
```
**Issue**: [Title]
**Page/Component**: [Where it occurs]
**Steps to Reproduce**: [Exact steps]
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Screenshots/Video**: [If applicable]
**Impact**: [Critical/High/Medium/Low]
**Environment**: [Browser, device, OS]
```

---

**End of Testing Guide**