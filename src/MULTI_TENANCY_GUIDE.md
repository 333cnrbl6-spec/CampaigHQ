# Multi-Tenancy Architecture

## Overview
This document describes the multi-tenancy system that enables Green Party National to manage 600+ constituent campaigns with isolated data.

## Core Concepts

### 1. Campaign-Scoped Data
Every entity has a `campaign_id` field that isolates records to a specific campaign:
- **Contacts** → Voter records specific to one campaign
- **Turfs** → Canvassing zones for one campaign
- **CanvassingLogs** → Activity specific to one campaign
- **Tasks, Events, Interactions** → All campaign-specific

### 2. User → Campaign Relationships
Instead of a single `campaign_id` on User, we use `campaign_memberships`:

```json
{
  "email": "organiser@example.com",
  "campaign_memberships": [
    {
      "campaign_id": "xyz123",
      "role": "campaign_admin",
      "added_date": "2026-05-01T10:00:00Z",
      "status": "active"
    },
    {
      "campaign_id": "abc456",
      "role": "volunteer",
      "status": "active"
    }
  ],
  "default_campaign_id": "xyz123",
  "role": "user"  // Platform-level role: "admin" = national admin
}
```

### 3. Role Hierarchy

**Platform Roles** (on User.role):
- `admin` → National admin, unrestricted access to all campaigns
- `user` → Regular user, access limited to their memberships

**Campaign Roles** (in campaign_memberships):
- `volunteer` → Read-only access to assigned turfs/contacts
- `organiser` → Full CRUD on campaign data, manage volunteers
- `campaign_admin` → Full control, invite team members, manage settings
- (future: `national_admin` for multi-level orgs)

### 4. Permission System

File: `lib/permissions.js`

```javascript
canAccess(userRole, entityType, action)
// Examples:
canAccess('volunteer', 'contacts', 'read') // ✓ true
canAccess('volunteer', 'contacts', 'delete') // ✗ false
canAccess('campaign_admin', 'contacts', 'delete') // ✓ true
canAccess('national_admin', '*', '*') // ✓ always true
```

## Implementation Details

### Query Filtering

All entity queries must filter by campaign_id. Use the `useCampaignFilter` hook:

```javascript
import { useCampaignFilter } from '@/hooks/useCampaignFilter';

function MyComponent() {
  const { campaign } = useCampaign();
  const contacts = useCampaignFilter('Contact');

  // Automatically filters to current campaign
  const list = await contacts.list();
  
  // Auto-injects campaign_id on create
  const created = await contacts.create({ name: 'John', address: '123 Main' });
}
```

Or use React Query wrapper:

```javascript
import { useCampaignFilteredQuery } from '@/hooks/useCampaignFilter';

const { data: contacts } = useCampaignFilteredQuery('Contact');
```

### Campaign Context

File: `lib/CampaignContext.jsx`

Manages:
- Current active campaign (`campaign`)
- All campaigns user is member of (`campaigns`)
- User's role in current campaign (`userRole`)
- Switching between campaigns (`switchCampaign()`)
- Creating a new campaign (`createCampaign()`)
- Joining an existing campaign (`joinCampaign()`)

### Permission Checking

Use the `PermissionGate` component to conditionally render based on permissions:

```jsx
<PermissionGate entityType="contacts" action="delete">
  <DeleteButton />
</PermissionGate>

// Or programmatically:
import { canAccess } from '@/lib/permissions';

if (canAccess(userRole, 'turfs', 'create')) {
  // Show create turf form
}
```

### Team Management

File: `functions/manageCampaignMembers`

Allows organizers/admins to:
- Add users to campaign with specific role
- Remove users from campaign
- Change user role within campaign

Used by: `components/campaign/CampaignMembersPanel.jsx`

## Admin Features

### National Dashboard
Route: `/national`

**Access:** Platform admins only (role === 'admin')

Shows:
- Count of all campaigns
- Total contacts across all campaigns
- Canvassing progress by campaign
- Campaign status indicators
- Export functionality

### Data Export
Route: `/export`

**Access:** Campaign admins/organisers

Export options:
- Contacts (CSV/JSON)
- Turfs (CSV/JSON)
- Canvassing logs (CSV/JSON)
- Interactions (CSV/JSON)
- Tasks (CSV/JSON)
- Events (CSV/JSON)
- Leaflet runs (CSV/JSON)

All exports automatically filtered to user's campaign.

## Database Backfill (One-Time)

When migrating from single-campaign to multi-tenancy:

1. **Identify current campaign** from environment or campaign selection
2. **Backfill campaign_id** on all existing entities:
   ```javascript
   const campaign = await base44.entities.Campaign.list(...);
   for (const entity of ['Contact', 'Turf', 'Task', ...]) {
     const records = await base44.entities[entity].list(...);
     for (const record of records) {
       if (!record.campaign_id) {
         await base44.entities[entity].update(record.id, {
           campaign_id: campaign[0].id
         });
       }
     }
   }
   ```

3. **Update User model** to campaign_memberships structure

## Migration Path: Single → Multi-Tenancy

### Phase 1 (Complete ✓)
- [x] User model with `campaign_memberships`
- [x] Permission system (volunteer/organiser/campaign_admin)
- [x] Campaign context with multi-campaign support
- [x] Query filtering hook (`useCampaignFilter`)
- [x] Team management UI

### Phase 2 (Next)
- [ ] Backfill campaign_id on existing data
- [ ] Update all pages to use campaign filtering
- [ ] National dashboard + admin features
- [ ] Audit data isolation in production

### Phase 3 (Future)
- [ ] Support for regional tiers (city → ward campaigns)
- [ ] Data sharing between campaigns (read-only)
- [ ] Bulk operations across campaigns
- [ ] Advanced analytics by region

## Testing Checklist

- [ ] Create campaign as user → becomes campaign_admin
- [ ] Invite volunteer → appears in team, has volunteer permissions
- [ ] Switch campaigns → data filters correctly
- [ ] Organizer can't see other campaigns' data
- [ ] National admin can see all campaigns
- [ ] Export includes only current campaign's data
- [ ] Cannot manually set campaign_id on create/update

## Known Limitations

1. **User invites** currently go to existing users only (no email-based invites yet)
2. **Data sharing** between campaigns not yet supported (each is isolated)
3. **Bulk operations** limited to single campaign at a time

## Future Enhancements

- Regional campaign hierarchies (National → County → Ward)
- Cross-campaign volunteer management
- Shared data library (template turfs, scripts, etc.)
- Advanced analytics and consolidation