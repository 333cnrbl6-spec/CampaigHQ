# Campaign Manager User Guide

**Version 1.0** | Last Updated: May 2026 | Support: support@campaignhub.uk

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Campaign Setup](#campaign-setup)
3. [Contact Management](#contact-management)
4. [Field Canvassing](#field-canvassing)
5. [Team Coordination](#team-coordination)
6. [Reports & Analytics](#reports--analytics)
7. [Integrations](#integrations)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Quick Start

### 1. Create Your Campaign (5 minutes)

1. Sign up at **campaignhub.uk**
2. Click **Create Campaign**
3. Enter:
   - Campaign name (e.g., "Tyldesley Green 2026")
   - Candidate name
   - Constituency/ward
   - Election date
4. Click **Create**

You'll get an **Invite Code** automatically (e.g., `tyldesley-green-2026-AB3X`)

### 2. Invite Your Team (2 minutes)

1. Go to **Campaign Settings → Invite Team**
2. Share your invite code with:
   - **Organizers** — can create turfs, assign volunteers, view all data
   - **Volunteers** — can use field app, log interactions, see their assignments
3. Team members click the link, enter code, create account

### 3. Import Your Contacts (5 minutes)

1. Go to **Contacts → Import Data**
2. Upload CSV or Excel file with voter data
   - Required: Name, Address, Postcode
   - Optional: Phone, Email, Support Level
3. Click **Import** — typically completes in 2-5 minutes

### 4. Go Canvassing (Live)

1. Organizers go to **Field Mode** to assign turfs/streets
2. Volunteers open the **mobile app** on their phone
3. Volunteers knock doors, log responses, see real-time stats

---

## Campaign Setup

### Setting Up Your Campaign

**Dashboard → Campaign Settings**

- **Campaign Name** — e.g., "Tyldesley Green Party 2026"
- **Candidate Name** — Your candidate
- **Party** — e.g., "Green Party"
- **Election Date** — The polling day
- **Target Votes** — How many votes you need to win (optional, for analytics)
- **Logo & Colors** — Upload a logo and choose your party colors

### Organizing Your Team

**Campaign Settings → Team Members**

Add users by role:
- **Admin** — Create campaigns, manage billing, invite users
- **Organizer** — Create/edit turfs, assign volunteers, view all data
- **Volunteer** — Knock doors, log interactions, see leaderboards

### Creating Your Invite Code

**Campaign Settings → Invite Link**

Your invite code is auto-generated. Share it with volunteers:
- Email them: `Join our campaign: tyldesley-green-2026-AB3X`
- Post on social media (without exposing full details)
- Display at team meetings

---

## Contact Management

### Importing Voter Data

**Contacts → Import Data**

Supported formats:
- **CSV** (.csv) — Standard spreadsheet format
- **Excel** (.xlsx) — Microsoft Excel files
- **TMC** — Targeted Micro Canvassing format

**Column headers must include:**
- `name` or `full_name`
- `address` or `street`
- `postcode`

**Optional columns:**
- `phone`
- `email`
- `support_level` (strong_supporter, leaning, undecided, opposed, unknown)
- `notes`
- `canvassed` (true/false)

**Example CSV:**
```
name,address,postcode,phone,support_level,notes
John Smith,123 High Street,WN8 1AA,07700123456,leaning,Interested in climate policy
Jane Doe,45 Oak Lane,WN8 2BB,,undecided,First-time voter
```

### Organizing Your Contacts

**Contacts → Filters**

Search by:
- **Name, address, postcode** — Real-time search
- **Support Level** — Strong supporter, leaning, undecided, opposed
- **Tags/Turfs** — Organize by geographic area or category
- **Voter Status** — Registered voters, non-registered

**Bulk Actions:**
- **Select All** in current view
- **Apply Tags** to selected contacts
- **Remove Tags** from selected contacts

### Geocoding (Adding Map Coordinates)

**Contacts → Data Tools → Geocode All**

This adds latitude/longitude to contacts for:
- Mobile app routing
- Map visualization
- Route optimization

Process runs in background (takes 5-10 min). You can navigate away.

### Deduplication

**Contacts → Data Tools → Deduplicate**

Automatically finds and merges duplicate addresses:
- Combines tags from both records
- Keeps one "primary" contact
- Deletes the duplicate

Useful after importing multiple data sources.

---

## Field Canvassing

### For Organizers: Assigning Volunteers

**Field Mode → Assign Volunteers**

1. Go to **Field Mode**
2. Select a **turf** or **street**
3. Click **Assign Volunteer**
4. Choose volunteer from list
5. Click **Confirm**

Volunteer receives notification and sees assignment in their app.

### For Volunteers: Using the Mobile App

**Mobile App (iOS/Android)** → **Field Mode**

1. **View Your Assignment**
   - You'll see which turf/street you're assigned to
   - See number of doors to knock
   - See support levels of contacts

2. **Knock Doors**
   - App shows next contact to visit
   - Displays their address, phone, email, past notes
   - Shows proximity (you're ± 50m away)

3. **Log Interaction**
   - Click **Log Response**
   - Select outcome: Positive, Neutral, Negative, No Answer
   - Add optional notes
   - App saves offline (syncs when online)

4. **See Progress**
   - Real-time door count
   - Leaderboard: see your rank vs other volunteers
   - Session summary at end of day

### Features for Canvassers

**Welfare Check-In**
- Every 30 minutes, you'll see a safety check prompt
- Confirm you're okay
- If you don't check in, your team lead gets an alert

**Offline Mode**
- Mobile app works offline
- All interactions saved locally
- Syncs automatically when reconnected

**Route Optimization**
- App suggests most efficient route
- Reorder contacts by proximity
- Minimize travel time between doors

---

## Team Coordination

### Creating Canvassing Shifts

**Shifts → Create New Shift**

1. **Shift Details**
   - Name: "North Tyldesley Canvass"
   - Date & time: When canvassing happens
   - Location: Meeting point (e.g., "High Street car park")

2. **Assignments**
   - Assign a team lead (main point of contact)
   - Add optional turf (auto-assign geography)
   - Set volunteer capacity (e.g., 20 volunteers)

3. **Materials**
   - Add leaflets, clipboards, scripts
   - Volunteers see packing list

### Real-Time Team Tracking

**Live Map**
- See all volunteers currently canvassing
- View their location (with consent)
- See how many doors each has knocked
- Contact volunteers directly

### Team Chat

**Chat → Campaign Channel**

- Message all team members
- Share updates ("Meet at 2pm instead of 1:30")
- Post announcements ("New leaflet just arrived")
- Group by role (Organizers, Volunteers, All)

---

## Reports & Analytics

### Campaign Dashboard

**Dashboard** — Your campaign snapshot

Shows:
- **Total Contacts** — How many in database
- **Canvassed** — How many you've visited
- **Support Breakdown** — Pie chart of support levels
- **Active Volunteers** — Who's canvassing today
- **Upcoming Events** — Shifts, meetings, deadlines

### Leaderboard

**Leaderboard** — Gamified volunteer performance

Shows:
- Volunteer name & photo
- Doors knocked (this week)
- Support level breakdown
- Hours canvassed
- Rank (encourages friendly competition)

### Detailed Reports

**Reports → Export Report**

Generate reports for:
- **Canvassing Summary** — Total doors, response rates, support breakdown
- **Volunteer Performance** — Hours, doors, contacts
- **Support Analysis** — Geographic breakdown by support level
- **Contact Export** — Full contact list with interaction history (CSV)

All reports are exportable as PDF or CSV.

---

## Integrations

### Email Alerts

**Settings → Email Alerts**

Get notified of:
- New volunteer signups
- Canvassing shifts starting soon
- Leaderboard milestones ("You've passed 500 doors!")
- Low volunteer turnout warnings

### Slack Notifications (Pro & Enterprise)

**Settings → Slack Integration**

Connect your Slack workspace:
1. Click **Connect Slack**
2. Authorize the app
3. Choose channels to post to:
   - #general (all announcements)
   - #volunteers (canvassing activity)
   - #leadership (milestones, alerts)

### SMS Alerts (Pro & Enterprise)

**Settings → SMS Alerts**

Send text alerts for:
- Urgent shift reminders
- Day-of confirmations ("Confirm you're canvassing at 2pm?")
- Route changes ("New street added to your turf")

**Cost:** £0.03–0.05 per SMS (paid separately)

---

## Troubleshooting

### Contacts Not Importing

**Problem:** Upload file shows error

**Solutions:**
1. Check file format (CSV or Excel only)
2. Verify column headers include: `name`, `address`, `postcode`
3. Check for special characters (é, ñ, etc.) — these are fine
4. Check file size < 50MB
5. Try uploading smaller batch first (< 1000 rows)

**Still stuck?** Contact support: support@campaignhub.uk

### Mobile App Issues

**Problem:** App crashes or won't connect

**Solutions:**
1. **For offline:** Restart phone, reconnect to WiFi/mobile
2. **For crashes:** Force-quit app (swipe up on iPhone, hold on Android)
3. **Reinstall:** Delete app, download fresh from App Store/Play Store
4. **Clear cache:** Settings → Apps → Campaign Manager → Clear Cache

### Performance Slow

**Problem:** Dashboard/map loading slowly

**Solutions:**
1. Check internet connection (switch WiFi/mobile data)
2. Close other apps
3. Clear browser cache (Settings → Privacy)
4. Try different browser (if on desktop)
5. Reduce date range if viewing large data window

### Passwords & Access

**Problem:** Forgot password

**Solution:**
1. Go to login page
2. Click **Forgot Password**
3. Enter email
4. Click link in email
5. Enter new password

**Problem:** Can't access campaign

**Causes & solutions:**
- **Email verified?** Check for verification email
- **Joined campaign?** Ask organizer to invite you again
- **Role limited?** Ask organizer to upgrade your permissions

---

## FAQ

### Pricing & Billing

**Q: Can I try for free?**
A: Yes — 30-day free trial on all plans. No credit card required.

**Q: Can I upgrade mid-month?**
A: Yes. Upgrade anytime and pay the difference. Downgrade takes effect at end of billing cycle.

**Q: What if the election is postponed?**
A: Your data is safe. You can pause/resume your subscription, or keep it active as long as needed.

**Q: Can I export my data?**
A: Yes — go to **Contacts → Export** and download your full contact list with all interactions as CSV.

### Features & Usage

**Q: How many volunteers can I add?**
A: Unlimited on all plans. Each can use the mobile app.

**Q: Can volunteers work offline?**
A: Yes. The mobile app works fully offline. Changes sync when reconnected to internet.

**Q: How do I track volunteer hours?**
A: Each canvassing session auto-logs duration. Check **Leaderboard** for volunteer hours.

**Q: Can I import data mid-campaign?**
A: Yes. Import multiple times. The system prevents duplicates automatically.

**Q: How is data secured?**
A: All data encrypted in transit (HTTPS) and at rest. GDPR-compliant. Access logs tracked for audit.

### Compliance & Legal

**Q: Is the app GDPR compliant?**
A: Yes. We track consent, offer data deletion, and maintain audit logs. See **Settings → GDPR** for details.

**Q: Can volunteers delete their data?**
A: Yes. They can request deletion in **Settings → Privacy**. Data is permanently deleted within 30 days.

**Q: Can I use electoral register data?**
A: Yes, with consent. We track consent method (door knock, email, form) and let you export consent records.

**Q: Who owns the voter data?**
A: You do. Export anytime. After 12 months post-election, we delete data unless you ask to keep it.

### Support & Onboarding

**Q: Is there training?**
A: Yes. **Training Center** has 6 video guides (admin, volunteer, field, data, reporting, GDPR). **Demo campaign** shows sample data.

**Q: Can I request custom features?**
A: Yes. Email support@campaignhub.uk or go to **Settings → Feedback**.

**Q: What's your response time?**
A: Email support responds within 24 hours. Pro/Enterprise plans get phone support.

---

## Getting Help

**Email:** support@campaignhub.uk
**Response Time:** 24 hours (Pro/Enterprise: 4 hours)
**Training:** /training
**Demo:** /demo-import

---

**End of User Guide** | Questions? Contact support@campaignhub.uk