# Data Isolation & Permission Implementation Guide

## Overview
This guide ensures consistent permission logic, data isolation, and role-based access control across the campaign platform.

## 🔐 Core Principles

- **No Data Bleed**: Users see ONLY their own campaigns, contacts, and team data
- **Tier-Based Access**: Features unlock by subscription level (starter < professional < enterprise)
- **Role-Based Access**: Campaign roles determine operational permissions
- **Developer Access**: Single privileged email (configured) for sales/marketing/admin
- **Frontend Enforcement**: Permissions checked before rendering sensitive components
- **Backend Enforcement**: Always validate user ownership server-side

## 📋 Core Components

### 1. PermissionContext (`lib/PermissionContext.jsx`)
Centralized permission state management.

**Configuration**: Update `DEVELOPER_EMAIL` to your developer's email address.

```javascript
const DEVELOPER_EMAIL = 'your-email@yourdomain.com';
```

**Permissions Object**:
```javascript
{
  role: 'volunteer|organizer|campaign_admin|admin',
  tier: 'starter|professional|enterprise',
  modules: [], // Array of enabled modules
  canAccessAdmin: boolean,
  canManageTeam: boolean,
  canAccessReporting: boolean,
  canManageCampaign: boolean,
  canAccessDataImport: boolean,
  canAccessBilling: boolean,
  email: string,
  isDeveloper: boolean,
  loading: boolean
}
```

### 2. EnhancedPermissionGate (`components/auth/EnhancedPermissionGate.jsx`)
Wraps components to enforce access control.

**Usage Examples**:
```jsx
// Gate by role
<PermissionGate requiredRole="campaign_admin">
  <AdminPanel />
</PermissionGate>

// Gate by tier
<PermissionGate requiredTier="professional">
  <ReportingDashboard />
</PermissionGate>

// Gate by module
<PermissionGate requiredModule="automation">
  <OutreachSequenceManager />
</PermissionGate>

// With custom fallback
<PermissionGate requiredTier="enterprise" fallback={<UpgradePrompt />}>
  <AdvancedAnalytics />
</PermissionGate>
```

### 3. Data Isolation Utilities (`lib/dataIsolation.js`)
Helper functions to safely load user-scoped data.

**Key Functions**:

```javascript
// Load entities filtered by current user
await loadUserData('Contact', { campaign_id: campaignId });

// Validate campaign ownership
await validateCampaignAccess(campaignId);

// Load only current user's campaigns
await loadCurrentUserCampaigns();

// Validate contact access
await validateContactAccess(contactId, campaignId);
```

## 🎯 Subscription Tiers

### Starter
- **Modules**: dashboard, contacts, volunteers, map
- **Target**: Small campaigns, local groups
- **Limits**: Basic features only

### Professional
- **Modules**: + reporting, automation, leafleting
- **Target**: Growing campaigns, 50-500 volunteers
- **Features**: Advanced analytics, outreach sequences

### Enterprise
- **Modules**: + api, integrations, advanced_analytics
- **Target**: National campaigns, 1000+ volunteers
- **Features**: Custom integrations, white-label support

## 👥 User Roles

### Volunteer
- Can complete assigned canvassing tasks
- Can view personal performance
- Limited access to tools

### Organizer
- Can manage volunteer assignments
- Can create/assign turfs
- Can view team performance
- Can access some reports

### Campaign Admin
- Can manage entire campaign
- Can manage team members
- Can access all data
- Can manage billing
- Can access all reports

### Developer (Email-Gated)
- Full system access
- Can access /developer-portal
- Can manage system settings
- Can impersonate users (if needed)

## ✅ Implementation Checklist

### Phase 1: Configuration
- [ ] Update `DEVELOPER_EMAIL` in `PermissionContext.jsx`
- [ ] Wrap App with `<PermissionProvider>`
- [ ] Import and use `usePermissions()` hook

### Phase 2: Data Isolation
- [ ] Import `dataIsolation.js` utilities
- [ ] Replace all entity.list() with loadUserData()
- [ ] Add validateCampaignAccess() checks
- [ ] Audit backend functions for user filtering

### Phase 3: Route Protection
- [ ] Wrap routes with `PermissionGate` component
- [ ] Add requiredRole/requiredTier props
- [ ] Test with different user roles/tiers
- [ ] Add fallback UI for locked features

### Phase 4: Verification
- [ ] Test: Volunteer can't access admin panel
- [ ] Test: Starter tier can't access reporting
- [ ] Test: Non-developer can't access /developer-portal
- [ ] Test: User A can't see User B's campaigns
- [ ] Test: Contact records only show for authorized campaigns

## 🔐 Security Best Practices

### Frontend
- ✅ Use PermissionGate for component visibility
- ✅ Check permissions before rendering forms
- ✅ Show locked feature UI for restricted access
- ❌ Don't hide data in CSS (use PermissionGate)
- ❌ Don't trust URL params for authorization

### Backend
- ✅ Always filter by `created_by` or user email
- ✅ Validate campaign ownership on every request
- ✅ Use `base44.auth.me()` for current user
- ✅ Log data access attempts (audit trail)
- ❌ Never expose other users' data
- ❌ Never skip authentication checks
- ❌ Never trust client-side user ID

### Database Queries
```javascript
// ✅ CORRECT - Filters by user
const campaigns = await base44.entities.Campaign.filter({
  owner_email: user.email
});

// ❌ WRONG - Returns all campaigns
const campaigns = await base44.entities.Campaign.list();

// ✅ CORRECT - Multi-step validation
const campaign = await validateCampaignAccess(campaignId);
const contacts = await base44.entities.Contact.filter({
  campaign_id: campaignId
});

// ❌ WRONG - Trusts campaign_id from user input
const contacts = await base44.entities.Contact.filter({
  campaign_id: req.body.campaign_id // Could be any campaign!
});
```

## 📊 Module Mapping

**Starter Tier**:
- dashboard
- contacts
- volunteers
- map

**Professional Tier** (adds):
- reporting
- automation
- leafleting

**Enterprise Tier** (adds):
- api
- integrations
- advanced_analytics

## 🔗 Routes Using Permissions

```javascript
// Admin-only routes
<Route path="/admin" element={<PermissionGate requiredRole="campaign_admin"><AdminPanel /></PermissionGate>} />
<Route path="/developer-portal" element={<DeveloperPortal />} /> // Email-gated internally

// Tier-gated routes
<Route path="/reporting" element={<PermissionGate requiredTier="professional"><Reports /></PermissionGate>} />
<Route path="/automation" element={<PermissionGate requiredModule="automation"><OutreachAutomation /></PermissionGate>} />

// Subscription view
<Route path="/subscription" element={<SubscriptionView />} /> // Shows current user's data only
```

## 🐛 Debugging Permissions

### Check current permissions:
```javascript
import { usePermissions } from '@/lib/PermissionContext';

function DebugComponent() {
  const perms = usePermissions();
  console.log('Current permissions:', perms);
  return <pre>{JSON.stringify(perms, null, 2)}</pre>;
}
```

### Common Issues:

1. **"Feature locked for user" but should be available**
   - Check DEVELOPER_EMAIL matches user's email
   - Verify user.subscription_tier is set in database
   - Check tier hierarchy (starter=0, professional=1, enterprise=2)

2. **"User A can see User B's campaigns"**
   - Check backend function filters by created_by
   - Verify loadUserData() is used, not list()
   - Audit campaign owner_email field

3. **Developer portal shows "Access Denied"**
   - Verify DEVELOPER_EMAIL matches exactly
   - Check user.email in auth.me()
   - Ensure email is lowercase in database

## 📱 Pages Using Permissions

- **DeveloperPortal** (`pages/DeveloperPortal.jsx`) - Email-gated, admin/developer only
- **SubscriptionView** (`pages/SubscriptionView.jsx`) - Shows current user's subscription only
- All campaign pages - Use PermissionGate for tier-based features

## 🔄 How It Works

1. **User logs in** → `AuthProvider` loads user data
2. **PermissionProvider initializes** → Loads role, tier, modules
3. **Component mounts** → Uses `usePermissions()` hook
4. **PermissionGate checks** → Evaluates role/tier/module requirements
5. **Renders or fallback** → Shows feature or locked UI
6. **Backend filters** → Only returns user's data

## 📝 Backend Function Template

```javascript
// functions/getCampaignData.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Filter by user email
    const campaigns = await base44.entities.Campaign.filter({
      owner_email: user.email
    }, '-updated_date', 100);

    return Response.json({ campaigns });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

## 🎨 Branding Isolation

Audit pages for hardcoded company data:

```javascript
// ❌ WRONG - Contains old company data
<div>
  <h1>Old Company Platform</h1>
  <p>Call us: 01204 695919</p>
  <p>Email: old@company.com</p>
</div>

// ✅ CORRECT - Generic or dynamic
<div>
  <h1>Campaign Management Platform</h1>
  <p>For support, contact your campaign administrator</p>
</div>
```

Files to audit:
- pages/GreenPartyDemo.jsx
- pages/LandingPage.jsx
- components/layout/AppLayout.jsx
- Any page with hardcoded contact info

## 🚀 Next Steps

1. Update `DEVELOPER_EMAIL` in PermissionContext
2. Wrap all campaign routes with PermissionGate
3. Audit backend functions for user filtering
4. Test with different tier/role accounts
5. Remove any hardcoded company data
6. Enable data isolation audit logging

---

**Last Updated**: 2026-05-03
**Version**: 1.0.0