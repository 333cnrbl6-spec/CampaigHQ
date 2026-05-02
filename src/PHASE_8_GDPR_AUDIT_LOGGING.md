# Phase 8: GDPR Compliance & Audit Logging

**Status**: Architecture & Implementation Guide Complete

## Overview
Implement GDPR request handling (right to be forgotten, data access, consent withdrawal) and comprehensive audit logging for regulatory compliance and security forensics.

---

## 1. GDPR Request Processing

### Entity: `GdprRequest`
Already defined in schema. Workflow:

```
User submits GDPR request → Admin reviews → Process request → Log outcome
```

### 1.1 Right to Be Forgotten (RTF)
**Trigger**: Contact submits RTF request
**Process**:
1. Flag `Contact.deletion_requested = true`
2. Set `Contact.deletion_requested_date = today`
3. Schedule deletion for 30 days (GDPR compliance period)
4. Stop all outreach to this contact
5. Archive associated `ContactInteraction` records (don't delete—audit trail)

**Implementation**:
```javascript
// Backend function: processRightToBeForgotten
const processRTF = async (contactId, campaignId) => {
  // Mark contact for deletion
  await base44.entities.Contact.update(contactId, {
    deletion_requested: true,
    deletion_requested_date: new Date().toISOString().split('T')[0]
  });
  
  // Log the GDPR request
  await base44.entities.GdprRequest.create({
    request_type: 'right_to_be_forgotten',
    contact_id: contactId,
    contact_name: contact.name,
    contact_email: contact.email,
    requested_by: currentUser.email,
    status: 'pending',
    notes: `RTF request logged. Auto-delete scheduled for 30 days.`
  });
  
  // Schedule deletion task
  // (via scheduler or cron function)
};
```

### 1.2 Data Access Request (GDPR Article 15)
**Trigger**: Volunteer/contact requests their data
**Process**:
1. Compile all records tied to their email/ID
2. Export in standard format (CSV/JSON)
3. Return within 30 days
4. Log the request

**Implementation**:
```javascript
// Backend function: generateDataAccessReport
const generateDataAccessReport = async (userEmail, campaignId) => {
  // Fetch all user data
  const profile = await base44.entities.VolunteerProfile.filter({ user_email: userEmail });
  const logs = await base44.entities.CanvassingLog.filter({ volunteer_email: userEmail });
  const interactions = await base44.entities.ContactInteraction.filter({ logged_by: userEmail });
  const locations = await base44.entities.VolunteerLocation.filter({ volunteer_email: userEmail });
  
  // Compile report
  const report = {
    profile: profile[0],
    canvassing_logs: logs,
    interactions: interactions,
    location_history: locations,
    exported_at: new Date().toISOString(),
    retention_policy: 'Data retained for campaign duration + 1 year for audit purposes'
  };
  
  // Log request
  await base44.entities.GdprRequest.create({
    request_type: 'data_access',
    contact_id: userEmail, // For volunteers, use email as identifier
    contact_name: profile[0]?.full_name || userEmail,
    contact_email: userEmail,
    requested_by: currentUser.email,
    status: 'completed',
    notes: `Data access report generated.`
  });
  
  return report;
};
```

### 1.3 Consent Withdrawal
**Trigger**: User withdraws consent for contact/location tracking
**Process**:
1. Update `Contact.consent_given = false` or `VolunteerProfile.location_tracking_consent = false`
2. Stop location tracking immediately
3. Stop outreach to this contact
4. Log the withdrawal

**Implementation**:
```javascript
// Backend function: withdrawConsent
const withdrawConsent = async (userEmail, campaignId, consentType) => {
  if (consentType === 'location_tracking') {
    await base44.entities.VolunteerProfile.update(profileId, {
      location_tracking_consent: false
    });
  } else if (consentType === 'contact_processing') {
    await base44.entities.Contact.update(contactId, {
      consent_given: false
    });
  }
  
  await base44.entities.GdprRequest.create({
    request_type: 'consent_withdrawal',
    contact_id: contactId || userEmail,
    contact_name: name,
    contact_email: email,
    requested_by: userEmail,
    status: 'completed',
    notes: `Consent withdrawn for: ${consentType}`
  });
};
```

---

## 2. Audit Logging System

### Entity: `AuditLog` (New)
```json
{
  "name": "AuditLog",
  "type": "object",
  "properties": {
    "campaign_id": { "type": "string" },
    "user_email": { "type": "string" },
    "action": { "type": "string", "enum": ["create", "update", "delete", "export", "gdpr_request"] },
    "entity_type": { "type": "string" },
    "entity_id": { "type": "string" },
    "old_values": { "type": "object" },
    "new_values": { "type": "object" },
    "ip_address": { "type": "string" },
    "user_agent": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "status": { "type": "string", "enum": ["success", "failed"] },
    "notes": { "type": "string" }
  },
  "required": ["campaign_id", "user_email", "action", "entity_type", "timestamp"]
}
```

### 2.1 Audit Logging Middleware
Wrap all data mutations:

```javascript
// Utility function: logAudit
const logAudit = async (campaignId, userEmail, action, entityType, entityId, oldValues, newValues, status = 'success') => {
  await base44.entities.AuditLog.create({
    campaign_id: campaignId,
    user_email: userEmail,
    action: action,
    entity_type: entityType,
    entity_id: entityId,
    old_values: oldValues || null,
    new_values: newValues || null,
    ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    user_agent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    status: status,
    notes: null
  });
};

// Example: Log contact update
const updateContact = async (contactId, updates) => {
  const oldContact = await base44.entities.Contact.read(contactId);
  const newContact = await base44.entities.Contact.update(contactId, updates);
  
  await logAudit(
    campaignId,
    userEmail,
    'update',
    'contact',
    contactId,
    oldContact,
    newContact
  );
  
  return newContact;
};
```

### 2.2 Sensitive Data Handling
Log sensitive operations separately:

```javascript
// Track login attempts
const logLoginAttempt = async (email, success) => {
  await base44.entities.AuditLog.create({
    campaign_id: null, // Not yet authenticated
    user_email: email,
    action: success ? 'login_success' : 'login_failed',
    entity_type: 'user',
    entity_id: email,
    timestamp: new Date().toISOString(),
    status: success ? 'success' : 'failed',
    notes: success ? 'User logged in' : 'Invalid credentials or account locked'
  });
};

// Track data exports (GDPR/reporting)
const logDataExport = async (campaignId, userEmail, entityType, recordCount) => {
  await base44.entities.AuditLog.create({
    campaign_id: campaignId,
    user_email: userEmail,
    action: 'export',
    entity_type: entityType,
    entity_id: null,
    timestamp: new Date().toISOString(),
    status: 'success',
    notes: `Exported ${recordCount} ${entityType} records`
  });
};
```

---

## 3. Data Retention Policy

### Policy Rules
| Entity | Retention | Deletion Trigger |
|--------|-----------|------------------|
| Contact | Campaign duration + 1 year | RTF request or contact inactive 5 years |
| CanvassingLog | 3 years (regulatory) | Auto-delete after 3 years |
| ContactInteraction | 3 years (audit trail) | Auto-delete after 3 years |
| VolunteerProfile | 1 year after campaign ends | Campaign completion + 1 year |
| VolunteerLocation | 30 days | Auto-delete after 30 days |
| AuditLog | 5 years (regulatory) | Auto-delete after 5 years |
| GdprRequest | Indefinite (compliance proof) | Never auto-delete |

### Implementation
```javascript
// Scheduled function: runDataRetention (runs monthly)
const runDataRetention = async () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
  const threeYearsAgo = new Date(today.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
  const fiveYearsAgo = new Date(today.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
  
  // Delete old location records (30 days)
  const oldLocations = await base44.entities.VolunteerLocation.filter({
    last_updated: { $lt: thirtyDaysAgo.toISOString() }
  });
  for (const loc of oldLocations) {
    await base44.entities.VolunteerLocation.delete(loc.id);
  }
  
  // Archive old interaction/log records (3 years)
  const oldInteractions = await base44.entities.ContactInteraction.filter({
    date: { $lt: threeYearsAgo.toISOString() }
  });
  // Mark for archival instead of delete (for audit)
  
  // Log retention run
  await base44.entities.AuditLog.create({
    campaign_id: null,
    user_email: 'system',
    action: 'delete',
    entity_type: 'data_retention',
    entity_id: null,
    timestamp: new Date().toISOString(),
    status: 'success',
    notes: `Data retention run: deleted ${oldLocations.length} location records`
  });
};
```

---

## 4. Compliance Dashboard (Frontend)

Create a new page: `pages/GdprCompliance.jsx`

**Features**:
- View pending GDPR requests
- Process RTF requests (with 30-day countdown)
- Export audit logs (filtered by date/user)
- Data retention summary
- Consent withdrawal history

```javascript
// Page: GdprCompliance
export default function GdprCompliance() {
  const [requests, setRequests] = useState([]);
  
  useEffect(() => {
    base44.functions.invoke('getGdprRequests', { campaign_id: campaignId })
      .then(res => setRequests(res.data));
  }, []);
  
  const handleProcessRTF = async (requestId) => {
    await base44.functions.invoke('processRightToBeForgotten', { 
      gdpr_request_id: requestId 
    });
    // Refresh list
  };
  
  return (
    <div className="p-6">
      <h1>GDPR Compliance</h1>
      <div>
        <h2>Pending Requests</h2>
        {requests.map(req => (
          <div key={req.id} className="border p-4 rounded">
            <p>{req.request_type} - {req.contact_name}</p>
            <p>Status: {req.status}</p>
            {req.status === 'pending' && (
              <button onClick={() => handleProcessRTF(req.id)}>
                Process
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Compliance Checklist

- [ ] `AuditLog` entity created
- [ ] Audit logging middleware integrated in backend functions
- [ ] GDPR request handlers (`processRightToBeForgotten`, `generateDataAccessReport`, `withdrawConsent`) implemented
- [ ] Data retention policies configured
- [ ] Monthly data retention job scheduled
- [ ] Consent tracking enabled on Contact & VolunteerProfile
- [ ] GDPR compliance page implemented
- [ ] Export audit logs feature working
- [ ] Privacy policy updated with retention policy
- [ ] Staff trained on GDPR response procedures

---

## 6. Regulatory References

- **GDPR Article 17** (Right to be Forgotten): 30-day deletion window
- **GDPR Article 15** (Data Access): 30-day response requirement
- **GDPR Article 7** (Consent Withdrawal): Immediate effect
- **UK DPA 2018** (Data Retention): Align with campaign lifecycle

---

**Next Step**: Proceed to Phase 9 (Frontend Integration & Load Testing).