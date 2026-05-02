# User Acceptance Testing Checklist
**Target User:** greenpartypaul@gmail.com  
**Date:** 2026-05-02  
**Campaign:** Tyldesley & Mosley Common — Paul Binns for Council  

---

## Instructions
Walk through each section below. Check the box when complete. If any step fails, note the issue in red and contact development immediately.

---

## 1. AUTHENTICATION & SETUP

- [ ] **Login** — Use your email (greenpartypaul@gmail.com) to log in
  - Expected: Dashboard loads automatically
  - Issue: _________________

- [ ] **Campaign Auto-Load** — Verify campaign name "Tyldesley & Mosley Common" appears in header
  - Expected: Campaign name displays under "Campaign HQ"
  - Issue: _________________

- [ ] **Sidebar Navigation** — Check sidebar loads with sections: Overview, Canvassing, Volunteers, Outreach, Admin
  - Expected: All sections visible and clickable
  - Issue: _________________

---

## 2. CONTACTS MANAGEMENT

- [ ] **View Contacts** — Navigate to "Voter Contacts" page
  - Expected: List of contacts displays (should be 300+ from import)
  - Issue: _________________

- [ ] **Search Contacts** — Search for a contact by name/postcode
  - Expected: Results filter in real-time
  - Issue: _________________

- [ ] **Filter Contacts** — Filter by "Registered Voters"
  - Expected: Count updates; only voters shown
  - Issue: _________________

- [ ] **Add New Contact** — Click "+ Add Contact" button
  - Fill: Name, Address, Postcode (e.g., M1 1AA), Phone
  - Expected: Contact appears in list
  - Issue: _________________

- [ ] **Edit Contact** — Click pencil icon on a contact
  - Change: Support level to "Strong Supporter"
  - Expected: Change saves and refreshes list
  - Issue: _________________

- [ ] **Delete Contact** — Click trash icon; confirm deletion
  - Expected: Contact removed from list
  - Issue: _________________

- [ ] **Bulk Select Contacts** — Check 5 contacts using checkboxes
  - Expected: "5 selected" appears at top
  - Issue: _________________

- [ ] **Bulk Tag** — With 5 selected, click "Apply Tags" button
  - Add: "Priority" tag
  - Expected: All 5 contacts now show "Priority" badge
  - Issue: _________________

---

## 3. GEOCODING & DATA SETUP

- [ ] **View Geocoding Status** — Look at Contacts page header
  - Expected: Shows "X/Y geocoded (Z%)" indicator
  - Issue: _________________

- [ ] **Run Geocoding** — Click "Data Setup Tools" → "Geocode All"
  - Expected: Loader appears; wait 2-3 minutes
  - Message should show: "Geocoded [N] contacts — M failed (no postcode)"
  - Issue: _________________

- [ ] **Assign Turfs** — Click "Assign Turfs" button
  - Expected: Loader; message shows "Tagged [N] contacts with turf zones"
  - Verify: Contacts now have zone tags (e.g., "E1", "E2")
  - Issue: _________________

- [ ] **Filter by Turf Zone** — Use turf filter dropdown to select a zone
  - Expected: Contacts list filters to only that zone
  - Issue: _________________

---

## 4. DASHBOARD & ANALYTICS

- [ ] **View Dashboard** — Click "Dashboard" in sidebar
  - Expected: Stats cards display: Doors Knocked, Supporters, This Week, Active Tasks
  - Issue: _________________

- [ ] **Campaign Info Accurate** — Check header shows correct campaign name and candidate
  - Expected: "Tyldesley & Mosley Common" + "Paul Binns"
  - Issue: _________________

- [ ] **Support Analytics** — Scroll to pie chart
  - Expected: Chart shows supporter breakdown by level (Strong, Leaning, Undecided, Opposed)
  - Issue: _________________

- [ ] **Leaderboard Widget** — Scroll down
  - Expected: Top 5 volunteers ranked by doors knocked
  - Issue: _________________

- [ ] **Recent Activity** — Check activity feed at bottom
  - Expected: Shows recent contact/event activity
  - Issue: _________________

---

## 5. SHIFT MANAGEMENT

- [ ] **Navigate to Shifts** — Sidebar → "Shift Management"
  - Expected: Page loads (may be empty if no shifts created)
  - Issue: _________________

- [ ] **Create Shift** — Click "Create Shift" button (if available)
  - Fill: Title, Date, Start/End Time, Location
  - Expected: Shift appears in calendar/list
  - Issue: _________________

- [ ] **Sign Up for Shift** — If shifts exist, click "Sign Up"
  - Expected: Your name appears in attendees
  - Issue: _________________

---

## 6. OUTREACH & COMMUNICATIONS

- [ ] **Team Chat** — Navigate to "Team Chat"
  - Expected: Page loads; able to see messages/send new ones
  - Issue: _________________

- [ ] **Bulk Outreach** — Navigate to "Bulk Outreach"
  - Expected: Can select contacts and compose message
  - Issue: _________________

---

## 7. PERMISSIONS & ADMIN ACCESS

- [ ] **Admin Panel Hidden?** — Look at sidebar
  - Expected: "Admin Panel" NOT visible (unless you're campaign_admin)
  - Issue: _________________

- [ ] **Settings Accessible** — Look for "Campaign Settings" link in campaign header bar
  - Expected: Link appears and is clickable
  - Issue: _________________

---

## 8. FIELD MODE (Mobile/Offline)

- [ ] **Enter Field Mode** — Sidebar → "Field Mode"
  - Expected: Mobile-optimized interface loads
  - Issue: _________________

- [ ] **Allow Location** — When prompted, allow GPS access
  - Expected: Current location displayed (latitude/longitude)
  - Issue: _________________

- [ ] **Log Interaction** — Click on a contact
  - Select: Interaction type, outcome
  - Expected: Interaction logged and visible in history
  - Issue: _________________

---

## 9. REPORTING & EXPORT

- [ ] **View Reports** — Sidebar → "Reports & Analytics"
  - Expected: Dashboard with key metrics and charts
  - Issue: _________________

- [ ] **Export Data** — Sidebar → "Export Data"
  - Click: "Export Contacts" or similar
  - Expected: CSV/Excel file downloads
  - Issue: _________________

---

## 10. DATA INTEGRITY & GDPR

- [ ] **Deduplicate** — Contacts page → "Data Setup Tools" → "Deduplicate"
  - Expected: Process completes; message shows duplicates merged
  - Issue: _________________

- [ ] **GDPR Compliance** — Sidebar → "GDPR Compliance"
  - Expected: Page loads; shows data retention and deletion options
  - Issue: _________________

---

## 11. MULTI-CAMPAIGN (If applicable)

- [ ] **Switch Campaign** — If user is in multiple campaigns, look for campaign switcher
  - Expected: Can click campaign name and switch to another
  - Issue: _________________

---

## OVERALL ASSESSMENT

### Functionality Score
- [ ] All critical features working (contacts, geocoding, dashboard)
- [ ] No crashes or errors
- [ ] Data appears accurate
- [ ] Performance acceptable (pages load <5 seconds)

### User Experience Score
- [ ] Navigation intuitive
- [ ] Buttons/actions clear
- [ ] Error messages helpful
- [ ] Mobile layout responsive

### Readiness for Launch
- [ ] Yes, ready to go live
- [ ] Ready with minor fixes noted above
- [ ] Needs additional work (describe below)

---

## ADDITIONAL NOTES

**Issues Found:**
1. _________________
2. _________________
3. _________________

**Feature Requests:**
1. _________________
2. _________________

**Feedback for Development:**
_________________

---

## SIGN-OFF

**Tester Name:** ________________________  
**Date:** ________________________  
**Approved for Launch:** ☐ Yes ☐ No ☐ Conditional

---

## NEXT STEPS (After Sign-Off)

1. ✅ Code deployed
2. ✅ Testing complete
3. ⬜ Launch to production
4. ⬜ Invite volunteers to platform
5. ⬜ Begin live canvassing operations

**Expected Launch Date:** [DATE]