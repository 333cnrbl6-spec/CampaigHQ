# DATA PROCESSING ADDENDUM (DPA)
## Between Green Party National and Campaign Manager

**Effective:** May 2, 2026  
**Platform:** Campaign Manager Enterprise License  
**Duration:** 2 years (May 2, 2026 - May 1, 2028)

---

## 1. DEFINITIONS

**Data Controller** = Green Party National (organization responsible for determining how voter data is used)

**Data Processor** = Campaign Manager platform provider (organization that processes data on behalf of Green Party)

**Personal Data** = Voter contact information (name, address, postcode, phone, email, voting history, support level, etc.)

**Processing** = Any operation on personal data (collection, storage, analysis, sharing, deletion)

**Sub-processor** = Third-party vendor used by Campaign Manager (e.g., cloud hosting, SMS provider)

---

## 2. DATA OWNERSHIP & CONTROL

### 2.1 Green Party Ownership
- ✅ All voter data belongs to Green Party National
- ✅ Green Party retains exclusive rights to use, analyze, and share voter data
- ✅ Campaign Manager has no ownership rights to the data
- ✅ Campaign Manager cannot sell, license, or repurpose voter data

### 2.2 Permitted Use by Campaign Manager
Campaign Manager may only:
- Store data on Green Party's behalf
- Process data per Green Party's instructions
- Generate reports & analytics (shown only to Green Party users)
- Perform technical operations (backups, security updates, disaster recovery)

Campaign Manager may NOT:
- Use voter data for machine learning model training
- Share data with third parties (except approved sub-processors)
- Analyze data for Campaign Manager's own purposes
- Retain data after contract termination

### 2.3 Data Export & Portability
- ✅ Green Party can download all data as CSV at any time
- ✅ On contract termination, all data provided within 5 days
- ✅ Data format: Standard CSV (not proprietary format)
- ✅ No extraction fee charged

---

## 3. DATA PROCESSING TERMS

### 3.1 Scope of Processing
Campaign Manager will process the following categories of personal data:

| Category | Scope | Example |
|----------|-------|---------|
| **Identifier** | Name, address, postcode, phone, email | John Smith, 123 High St, WN8 1AA |
| **Political** | Support level, voting history, policy interests | Leaning, voted Green 2019 |
| **Interaction** | Canvassing notes, responses, conversations | "Interested in climate policy" |
| **Geographic** | Latitude, longitude (geocoded) | 53.4891, -2.5127 |
| **Behavioral** | Login activity, app usage, reporting queries | Last accessed 2026-05-05 10:22am |

### 3.2 Purpose of Processing
Campaign Manager will process data only for:
1. **Campaign coordination** — Assigning volunteers to turfs, tracking canvassing
2. **Volunteer management** — Scheduling shifts, tracking performance, leaderboards
3. **Reporting & analytics** — Generating dashboards, reports, insights for Green Party
4. **Compliance** — GDPR consent tracking, audit logs, right-to-be-forgotten requests
5. **Technical operations** — Backups, security, system maintenance, disaster recovery

### 3.3 Data Retention
- **During campaign:** Data retained for active use (May 2, 2026 - May 7, 2026)
- **Post-election (Year 1):** Data retained for 12 months (May 7, 2026 - May 7, 2027)
- **Post-Year 1:** Data retained indefinitely OR deleted per Green Party instruction
- **Upon termination:** Data deleted within 5 days (or longer if required by law)
- **Audit trail:** Consent records, GDPR requests, and access logs retained for 3 years (legal requirement)

---

## 4. SECURITY & ENCRYPTION

### 4.1 Encryption in Transit
- ✅ HTTPS TLS 1.3 required for all connections
- ✅ End-to-end encryption for data in motion
- ✅ No unencrypted transmission of voter data
- ✅ Certificate pinning to prevent man-in-the-middle attacks

### 4.2 Encryption at Rest
- ✅ AES-256 encryption for all databases
- ✅ Encryption keys stored separately from data (key management service)
- ✅ Keys rotated annually (minimum)
- ✅ Encryption recovery tested quarterly

### 4.3 Access Control
- ✅ Role-based access control (RBAC)
- ✅ Green Party users only see their campaign's data
- ✅ Admin users see all data (audit trail maintained)
- ✅ Campaign Manager staff have zero production access (except engineers for emergency)
- ✅ All access logged with timestamp, user ID, action taken

### 4.4 Network Security
- ✅ Firewall protecting data center
- ✅ DDoS protection enabled
- ✅ VPN access required for staff maintenance
- ✅ IP whitelisting available (optional for Tier 3)

### 4.5 Physical Security
- ✅ Data hosted on UK-based infrastructure (AWS London region or equivalent)
- ✅ Secure data center with 24/7 surveillance
- ✅ Disk encryption for all physical drives
- ✅ No USB/portable media allowed in data center
- ✅ Secure disposal of decommissioned hardware (wiping/shredding)

---

## 5. SUB-PROCESSORS

### 5.1 Approved Sub-Processors
Campaign Manager uses the following sub-processors to deliver services:

| Sub-processor | Service | Data Processed | Location |
|---------------|---------|----------------|----------|
| **AWS** | Cloud hosting | All voter/volunteer data | UK (London) |
| **Twilio** | SMS delivery | Phone numbers (if SMS enabled) | US (with UK backup) |
| **Stripe** | Payment processing | Billing contact info (NOT voter data) | US/EU |
| **SendGrid** | Email delivery | Email addresses (if email enabled) | US |

### 5.2 Right to Object
- ✅ Green Party can request alternative sub-processor
- ✅ Campaign Manager will switch if reasonable alternative exists
- ✅ No penalty fee for switching sub-processors
- ✅ 30 days notice required

### 5.3 Sub-processor Contracts
- ✅ All sub-processors have data processing agreements
- ✅ Sub-processor contracts available for Green Party review
- ✅ Sub-processors prohibited from using voter data except to provide services

---

## 6. DATA SUBJECT RIGHTS (GDPR)

### 6.1 Right to Access (Subject Access Request)
- Voter can request all data Campaign Manager holds about them
- Campaign Manager will respond within 30 days
- Data provided in human-readable format (PDF, CSV, or email)
- No fee charged (unless request is frivolous)

### 6.2 Right to Rectification (Correction)
- Voter can request incorrect data be corrected
- Campaign Manager will update within 10 days
- Updated data reflected in all reports/dashboards
- Audit log recorded

### 6.3 Right to Erasure (Right to Be Forgotten)
- Voter can request their data be deleted
- Campaign Manager will delete within 30 days
- Deletion is permanent (not reversible)
- Cannot be forced to delete if legal obligation to retain (electoral law, audit trail)

### 6.4 Right to Restrict Processing
- Voter can request data processing be paused (not deleted)
- Campaign Manager will stop processing (except essential operations)
- Data retained for 12 months as backup
- Can be restored on voter request

### 6.5 Right to Data Portability
- Voter can request their data in portable format (CSV, JSON)
- Campaign Manager will provide within 30 days
- Format: Standard, machine-readable format
- No fee charged

### 6.6 Right to Object
- Voter can object to processing for political purposes
- Campaign Manager will cease processing within 10 days
- Data may be deleted or anonymized
- Preference recorded in audit log

---

## 7. CONSENT & LEGAL BASIS

### 7.1 Consent Tracking
Campaign Manager will track how consent was obtained:

| Consent Method | Valid For | Tracked In Platform |
|---|---|---|
| **Door knock** | Interview at home | Yes, with date & organizer name |
| **Phone call** | Phone conversation | Yes, with date & volunteer name |
| **Email** | Opt-in email link | Yes, with click timestamp |
| **Online form** | Signup form on website | Yes, with IP + browser info |
| **Electoral roll** | Public register | Yes, marked as "public data" |

### 7.2 Lawful Basis
Campaign Manager processes voter data under the following lawful bases:

1. **Legitimate interest** (GDPR Article 6(1)(f)) — Political campaigning is a legitimate interest, and voters have lower expectation of privacy for political contacts
2. **Consent** (GDPR Article 6(1)(a)) — Where explicit consent given (door knock, email signup)
3. **Legal obligation** (GDPR Article 6(1)(c)) — Electoral Commission regulations require record-keeping

### 7.3 Consent Withdrawal
- Voter can withdraw consent at any time
- Campaign Manager will stop contacting voter within 5 days
- Data retained for audit (cannot be deleted immediately)
- Preference flagged in CRM so volunteer doesn't re-contact

---

## 8. BREACH NOTIFICATION

### 8.1 Campaign Manager's Obligations
If Campaign Manager becomes aware of a data breach (unauthorized access, loss, or disclosure):

1. **Immediate notification** — Campaign Manager notifies Green Party within **24 hours**
2. **Details provided:**
   - What data was affected (names, addresses, email, phone, etc.)
   - How many people affected
   - What happened (hacked account? Stolen laptop? Misconfiguration?)
   - What Campaign Manager is doing to fix it
   - What Green Party should do (notify affected voters, press, ICO)

3. **Investigation report** — Full incident report within 72 hours
4. **Mitigation steps** — Campaign Manager implements fixes within 24 hours

### 8.2 Green Party's Obligations
- Green Party may choose to notify affected voters
- Green Party must notify Information Commissioner's Office (ICO) if required by law
- Green Party responsible for voter notifications (Campaign Manager can assist with wording)

### 8.3 Severity Levels

| Severity | Response Time | Example |
|----------|---------------|---------|
| **Critical** | 1 hour | Entire voter database exposed to internet |
| **High** | 4 hours | 10K voter records leaked in email |
| **Medium** | 24 hours | Organizer's laptop stolen (encrypted, minimal data) |
| **Low** | 72 hours | One person's record accessed by unauthorized staff |

---

## 9. AUDIT RIGHTS

### 9.1 Audit Log
Campaign Manager maintains an audit log recording:
- ✅ Who accessed the data (user ID, email)
- ✅ When they accessed it (timestamp)
- ✅ What they did (view, edit, delete, export)
- ✅ From where (IP address, device)

**Retention:** 3 years (legal requirement)

### 9.2 Audit Access
- ✅ Green Party can download audit logs anytime (CSV format)
- ✅ Green Party can query specific date ranges, users, or actions
- ✅ No fee for standard audit logs
- ✅ Real-time audit log streaming available (Tier 3 only)

### 9.3 External Audit
- ✅ Campaign Manager participates in annual independent security audit (SOC 2)
- ✅ Audit report provided to Green Party on request
- ✅ Any compliance findings addressed within 30 days

### 9.4 Penetration Testing
- Campaign Manager conducts annual penetration test
- Findings shared with Green Party (non-sensitive details)
- Any critical vulnerabilities patched within 48 hours

---

## 10. INTERNATIONAL DATA TRANSFERS

### 10.1 Data Residency
- ✅ All voter data stored in UK (AWS London region or equivalent)
- ✅ No data transferred to US, EU, or other countries
- ✅ Exception: Emergency backup to EU data center (encrypted, accessed only by Campaign Manager engineers with permission)

### 10.2 Sub-processor Transfers
Some sub-processors may store data internationally:
- **AWS:** Backup to Ireland (optional, emergency only)
- **Twilio:** SMS data may pass through US infrastructure
- **Stripe:** Billing data to US (not voter data)

**Green Party can request:**
- No international transfers (Tier 3 only)
- EU-only data residency
- US data flows blocked

---

## 11. TERMINATION & DATA HANDLING

### 11.1 End of Contract
Upon termination of the Platform License Agreement:

1. **Weeks 1-2:** Green Party given 14 days notice to access data
2. **Week 3:** Green Party downloads all data as CSV export
3. **Week 4:** Campaign Manager deletes all data from production systems
4. **Week 5:** Campaign Manager confirms deletion in writing

**Exceptions:**
- Backups retained for 30 days (standard practice)
- Audit logs retained for 3 years (legal requirement)
- Anonymized analytics retained indefinitely

### 11.2 Bankruptcy/Insolvency
If Campaign Manager becomes insolvent:
- ✅ All voter data immediately transferred to secure third-party custody
- ✅ Green Party notified within 24 hours
- ✅ Data returned to Green Party or destroyed per instruction
- ✅ No access by liquidators or creditors

---

## 12. LIABILITY & INDEMNIFICATION

### 12.1 Data Breach Liability
If Campaign Manager is found liable for a data breach:
- Liability capped at fees paid in preceding 12 months (max £200,000)
- Not liable for Green Party's costs (e.g., voter notifications, credit monitoring, ICO fines)
- Not liable for reputational damage or lost elections

**Exception:** If Campaign Manager is found grossly negligent (e.g., passwords stored in plaintext), liability cap may not apply.

### 12.2 Indemnification
Campaign Manager will indemnify (cover costs for) Green Party if:
- Campaign Manager is sued for GDPR violations caused by Campaign Manager
- Campaign Manager's sub-processor breaches data protection laws
- Campaign Manager's security measures fall below "industry standard"

---

## 13. GDPR COMPLIANCE STATEMENT

Campaign Manager certifies that:

1. ✅ **Lawful Processing:** All processing complies with GDPR Articles 5-28
2. ✅ **Data Subject Rights:** All rights (access, erasure, portability, etc.) fully implemented
3. ✅ **Security:** Technical and organizational measures comply with GDPR Article 32
4. ✅ **Consent:** Consent tracking meets GDPR requirements for proof
5. ✅ **Breach Notification:** Breach procedures comply with GDPR Article 33
6. ✅ **Sub-processors:** All sub-processor agreements in place
7. ✅ **Audit:** Full audit trail maintained for 3 years
8. ✅ **Data Residency:** Data stored in UK (no international transfers without approval)

---

## 14. AMENDMENT & UPDATES

### 14.1 Changes to DPA
- Campaign Manager can propose amendments anytime
- Amendments require Green Party written approval
- Material changes (e.g., sub-processor changes) require 30 days notice
- Green Party can terminate if changes are unacceptable

### 14.2 Changes to Law
If new laws/regulations affect data processing:
- Campaign Manager will notify Green Party within 10 days
- Campaign Manager will implement required changes at no extra cost
- Campaign Manager will not rely on force majeure (act of God) excuse

---

## 15. TERM & TERMINATION

### 15.1 Duration
This DPA is effective for the duration of the Platform License Agreement (2 years).

### 15.2 Termination
Either party can terminate this DPA if:
- **Material breach:** Other party fails to comply with security/privacy terms after 30-day notice
- **Regulatory change:** New law makes processing impossible
- **Business decision:** End of Platform License Agreement

### 15.3 Survival
After termination:
- Obligations to delete data survive
- Confidentiality obligations survive
- Indemnification obligations survive

---

## 16. GOVERNING LAW & DISPUTE RESOLUTION

### 16.1 Governing Law
This DPA is governed by UK law (not US, not EU).

### 16.2 Jurisdiction
Disputes are resolved in UK courts (England & Wales).

### 16.3 Dispute Process
1. **Informal negotiation:** Both parties attempt to resolve (14 days)
2. **Mediation:** Independent mediator appointed if needed (30 days)
3. **Arbitration:** If mediation fails, arbitration (not court) used to save costs
4. **ICO Referral:** Either party can refer GDPR violations to UK Information Commissioner's Office (ICO)

---

## SIGNATURES

**For Green Party National:**

Name: _________________________ Date: _____________

Title: _________________________

Signature: _________________________

---

**For Campaign Manager:**

Name: _________________________ Date: _____________

Title: _________________________

Signature: _________________________

---

**Witnessed by:**

Legal Counsel (Green Party): _________________________ Date: _____________

Legal Counsel (Campaign Manager): _________________________ Date: _____________

---

## APPENDIX A: STANDARD CONTRACTUAL CLAUSES (SCCs)

*[Include EU Standard Contractual Clauses if any data flows to EU post-Brexit]*

*Not required if data remains in UK only.*

---

## APPENDIX B: SUB-PROCESSOR LIST

*[Detailed list of all sub-processors with data categories and purposes]*

---

*This DPA is binding and supersedes any previous data processing agreements between the parties.*

*Version 1.0 | Effective May 2, 2026*