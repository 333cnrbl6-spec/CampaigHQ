# SERVICE LEVEL AGREEMENT (SLA)
## Campaign Manager Enterprise License

**Effective:** May 2, 2026  
**License Tier:** Professional (£200K) & Enterprise (£250K)  
**Service Period:** 2 years (May 2, 2026 - May 1, 2028)

---

## 1. SERVICE AVAILABILITY GUARANTEE

### 1.1 Uptime Commitment

**Tier 2 (Professional):** Best-effort (no SLA, but monitored 24/7)  
**Tier 3 (Enterprise):** 99.5% uptime guarantee

**What "uptime" means:**
- Platform accessible to Green Party users (organizers, volunteers)
- Mobile app functional (data sync, logging responses)
- API endpoints responsive (< 2 second response time)
- Database operations successful (no data corruption)

**What "downtime" excludes (does NOT count against SLA):**
- Planned maintenance windows (announced 72 hours in advance, max 2 hours/month)
- User's internet connectivity issues
- User's device/browser issues
- Third-party services (Slack, Twilio, SendGrid — if their systems down)
- Force majeure (natural disaster, government action, war)

### 1.2 Uptime Calculation

**Monthly uptime = (Total minutes in month - Downtime minutes) / Total minutes in month**

**Example:**
- May has 43,200 minutes (30 days × 24 hours × 60 mins)
- 99.5% uptime = max 216 minutes downtime allowed (~3.6 hours)
- If platform down 100 mins: 43,100 / 43,200 = 99.77% ✅ (exceeds 99.5%)
- If platform down 250 mins: 42,950 / 43,200 = 99.42% ❌ (misses 99.5%, credit owed)

### 1.3 Service Credit for Downtime (Tier 3 Only)

| Uptime | SLA Miss | Service Credit |
|--------|----------|-----------------|
| 99.5% - 99.0% | 1-2 hours | 10% of monthly fees |
| 99.0% - 98.0% | 2-4 hours | 25% of monthly fees |
| 98.0% - 95.0% | 4-12 hours | 50% of monthly fees |
| < 95.0% | > 12 hours | 100% of monthly fees + £500/hour downtime |

**Example:**
- Enterprise tier paying £200K/year = £16,667/month
- If uptime = 98.5% (miss by 1 hour): 10% credit = £1,667 applied to next month's invoice

### 1.4 Service Credit Claims
- Green Party must submit claim within 30 days of downtime
- Claim includes: date, time, duration, impact evidence
- Campaign Manager will verify using logs + timestamps
- Credit applied to next invoice within 5 business days

---

## 2. SUPPORT & RESPONSE TIMES

### 2.1 Support Channels

**Tier 2 (Professional):**
- Email support: support@campaignmanager.uk
- Response time: < 24 hours
- Hours: Monday-Friday 9am-5pm GMT
- Holiday coverage: Emergency support only

**Tier 3 (Enterprise):**
- Email support: support@campaignmanager.uk (< 4 hours response)
- Phone support: +44 (0)20 [number] (< 1 hour response)
- Slack integration: Direct message to @support-team (< 1 hour response)
- Hours: 24/7 (including weekends/holidays)
- Dedicated account manager: Direct phone number for escalations

### 2.2 Support Severity Levels

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|---|---|
| **Critical** | Platform completely down, no access | < 1 hour (Tier 3) | < 4 hours |
| **High** | Major feature broken, 100+ users affected | < 4 hours (Tier 3) | < 24 hours |
| **Medium** | Feature partially broken, < 100 users affected | < 24 hours (Tier 2/3) | < 5 business days |
| **Low** | Minor issue, workaround exists | < 48 hours (Tier 2/3) | < 10 business days |

**Examples:**
- **Critical:** Mobile app crashes for all volunteers, can't log responses
- **High:** Leaderboards not updating in real-time (volunteers can still canvass)
- **Medium:** Organizer can't filter contacts by support level (can use export workaround)
- **Low:** Dashboard styling incorrect on Safari browser

### 2.3 Contact Information

**Campaign Manager Support:**
- Email: support@campaignmanager.uk
- Phone: +44 (0)20 [number] (Tier 3 only)
- Slack: #support-request (if connected)
- Portal: https://support.campaignmanager.uk (ticket tracking)

**Green Party's Support Lead:**
- Name: [Organizer name]
- Email: [Email]
- Phone: [Phone]
- Slack: @[Slack handle]

---

## 3. PERFORMANCE BENCHMARKS

### 3.1 Dashboard Response Times

| Page | Target Load Time | Threshold |
|------|------------------|-----------|
| Login | < 2 seconds | Must load in < 3 seconds |
| Campaign Dashboard | < 2 seconds | Must load in < 3 seconds |
| Contact List (1000 rows) | < 3 seconds | Must load in < 5 seconds |
| Leaderboard (10K volunteers) | < 2 seconds | Must load in < 4 seconds |
| National Dashboard (650 campaigns) | < 3 seconds | Must load in < 5 seconds |
| Report Export (1M records) | < 30 seconds | Must complete in < 60 seconds |

**Measurement:** Response time = time from page request to fully loaded (images, data, interactivity)

### 3.2 Mobile App Performance

| Metric | Target | Threshold |
|--------|--------|-----------|
| App launch time | < 2 seconds | < 3 seconds |
| Log interaction (response) | < 1 second | < 2 seconds |
| Leaderboard update | Real-time (< 5 sec) | < 10 seconds |
| Offline sync time | < 30 seconds | < 60 seconds |
| Battery drain (4-hour session) | < 20% | < 30% |

### 3.3 Data Sync & Consistency

| Operation | Target Latency | Success Rate |
|-----------|---|---|
| Volunteer logs interaction | Sync within 5 mins | 99%+ |
| Leaderboard updates | Real-time | 99%+ |
| Report generation | < 60 seconds | 99%+ |
| Data export | < 300 seconds | 99%+ |

---

## 4. INCIDENT MANAGEMENT

### 4.1 Incident Escalation Path

```
Issue reported → Support receives ticket (< 1 hour Tier 3)
    ↓
Support diagnoses (< 2 hours)
    ↓
If critical: Page on-call engineer (Slack alert)
    ↓
Engineer investigates (< 15 mins)
    ↓
If fixable in < 4 hours: Engineer fixes + deploys
    ↓
If > 4 hours: Activate emergency war room
    ├─ Campaign Manager CTO joins
    ├─ Green Party leadership notified
    ├─ Hourly updates provided
    └─ Go/no-go: continue troubleshooting vs rollback to backup
    ↓
Incident resolved
    ↓
Post-mortem report filed (within 24 hours)
```

### 4.2 Communication During Outage

**If platform down for > 15 minutes:**

1. **Immediate:** Email alert sent to Green Party's support lead
   - Subject: "⚠️ Campaign Manager Platform Alert"
   - Content: Duration, scope, estimated time to fix

2. **Every 30 minutes:** Status update sent
   - "Still investigating... ETA 30 mins"
   - "Found root cause... Deploying fix now"
   - "Fix deployed... Verifying stability"

3. **Resolution:** Confirmation email sent
   - Duration of outage
   - Root cause (brief explanation)
   - Steps taken to prevent recurrence

4. **Post-incident:** Full report within 24 hours
   - Timeline of events
   - Root cause analysis
   - Corrective actions
   - Preventive measures implemented

### 4.3 Escalation Numbers

**If response time is missed:**

| Miss | Escalation | Action |
|------|-----------|--------|
| 1st miss | Yellow card | Review process, training for support staff |
| 2nd miss (within 30 days) | Orange card | Campaign Manager management review, compensation |
| 3rd miss (within 30 days) | Red card | Green Party can terminate contract with full refund |

---

## 5. MAINTENANCE & UPDATES

### 5.1 Planned Maintenance

**Frequency:** Up to 2 hours/month  
**Schedule:** Tuesday nights, 11pm-1am GMT (election period: avoid if possible)  
**Notice:** 72 hours advance notice required

**During maintenance:**
- ⚠️ Platform may be unavailable
- Users see "maintenance in progress" message
- Data is not lost or corrupted
- Syncing pauses (resumes after maintenance)

**Does NOT count against SLA uptime.**

### 5.2 Emergency Maintenance

**If security vulnerability discovered:**
- Campaign Manager can apply emergency patch immediately
- Green Party notified within 1 hour
- Maintenance window: < 30 minutes (goal)
- No advance notice required

### 5.3 Software Updates

**Bug fixes:** Deployed as soon as ready, no scheduled maintenance required  
**New features:** Deployed during planned maintenance window or off-peak hours  
**Breaking changes:** 30 days notice required (e.g., API deprecation)

---

## 6. SECURITY & COMPLIANCE COMMITMENTS

### 6.1 Security Baseline
- ✅ HTTPS/TLS 1.3 for all connections
- ✅ AES-256 encryption for data at rest
- ✅ Row-level access control (users see only their data)
- ✅ Audit logging for all data access
- ✅ Regular security updates & patching
- ✅ Firewall & DDoS protection
- ✅ Data hosted in UK only (no international transfers)

### 6.2 Compliance & Audits
- ✅ GDPR compliant (Article 32 security requirements met)
- ✅ Annual SOC 2 Type II audit (Tier 3 receives copy)
- ✅ Annual penetration testing
- ✅ Quarterly security patch cycle
- ✅ Incident response plan tested semi-annually

### 6.3 Data Breach Liability
- If Campaign Manager's systems breached due to negligence: full liability (no cap)
- If data leaked due to Green Party's poor password management: Campaign Manager not liable
- Both parties have cyber insurance (Campaign Manager carries £1M+ policy)

---

## 7. BACKUP & DISASTER RECOVERY

### 7.1 Backup Schedule

| Component | Backup Frequency | Retention | Recovery Time |
|-----------|---|---|---|
| Database | Every 6 hours | 30 days | < 2 hours |
| Logs | Daily | 3 years | < 1 hour |
| Configuration | Per change | 12 months | < 30 mins |

### 7.2 Disaster Recovery Plan

**If primary data center fails:**

1. **Detection (< 5 minutes):** Automated monitoring detects failure
2. **Failover (< 15 minutes):** Traffic redirected to backup infrastructure
3. **Verification (< 30 minutes):** Data consistency verified, backups checked
4. **Full recovery (< 4 hours):** Primary data center restored, traffic returns

**Recovery Point Objective (RPO):** < 6 hours of data loss (max)  
**Recovery Time Objective (RTO):** < 4 hours to full recovery

### 7.3 Disaster Recovery Testing

- Quarterly drills (simulate data center failure)
- Results documented + shared with Green Party
- Any issues found are fixed before next test
- Tested by third-party auditor annually (Tier 3)

---

## 8. TERMINATION & EXIT SUPPORT

### 8.1 End-of-Contract Support

**30 days before contract end date:**
- Campaign Manager provides notice of contract expiration
- Green Party given option to renew or terminate

**Upon termination:**
- Green Party given 5 days to download all data (CSV export)
- Data deletion completed within 7 days
- Audit logs retained for 3 years (legal requirement)
- Full data export + documentation provided free

### 8.2 Exit Support (Tier 2+)
- Campaign Manager assists with data migration to competitor platform
- Documentation provided: data schema, API specs, integration setup
- Up to 10 hours of consulting time included (no extra cost)

---

## 9. LIMITATION OF LIABILITY

### 9.1 Cap on Liability
Campaign Manager's total liability for:
- **Tier 2:** Capped at fees paid in preceding 12 months (max £200K)
- **Tier 3:** Capped at fees paid in preceding 12 months OR £500K (whichever is greater)

**Exception:** Liability not capped if:
- Campaign Manager is found to have gross negligence or willful misconduct
- Data breach is due to Campaign Manager's failure to implement required security
- Campaign Manager violates GDPR Article 32 (security requirements)

### 9.2 Excluded Damages
Campaign Manager is NOT liable for:
- Lost profits or lost revenue
- Lost elections or lost votes
- Reputational harm
- Indirect or consequential damages
- Green Party's costs for voter notifications or credit monitoring
- Green Party's regulatory fines (though Campaign Manager may reimburse if Campaign Manager caused breach)

### 9.3 Green Party's Liability
Green Party is liable for:
- Poor data quality (Campaign Manager not responsible for garbage data)
- Misuse of platform (e.g., storing non-election data)
- Negligent password management (e.g., sharing credentials with volunteers)
- Violation of terms of service

---

## 10. SERVICE LEVEL REVIEW

### 10.1 Monthly Review

**Every month (by the 5th):**
- Campaign Manager provides SLA report
- Report includes: uptime %, incidents, response times, credits owed
- Report sent to Green Party's support lead + finance contact

### 10.2 Quarterly Business Review

**Every quarter (Feb, May, Aug, Nov):**
- 1-hour call with Campaign Manager leadership + Green Party board rep
- Topics: SLA performance, roadmap, issues, feedback
- Action items documented + tracked

### 10.3 Annual Audit

**Every year (May):**
- Full audit of systems, security, compliance
- Third-party audit report (SOC 2) provided to Green Party
- Any issues addressed within 30 days

---

## 11. AMENDMENT & CHANGES

### 11.1 SLA Amendments
- Campaign Manager can propose SLA changes anytime
- Changes require Green Party written approval
- Changes cannot weaken SLA (e.g., uptime target cannot be lowered)
- Material changes take effect 30 days after notice

### 11.2 Scope Changes
If Green Party adds campaigns/volunteers mid-contract:
- SLA terms remain unchanged
- No reduction in service levels
- Costs may be adjusted per agreement

---

## 12. DISPUTE RESOLUTION

### 12.1 SLA Dispute Process

**Step 1: Notification (within 7 days)**
- Green Party notifies Campaign Manager of SLA miss
- Include: date, time, evidence (screenshots, logs, user reports)

**Step 2: Investigation (within 10 days)**
- Campaign Manager investigates using logs + backups
- Provides detailed response: agree/disagree + evidence

**Step 3: Resolution (within 20 days)**
- If Campaign Manager agrees: credit issued automatically
- If Campaign Manager disagrees: escalate to arbitration

**Step 4: Arbitration (within 30 days)**
- Independent arbitrator reviews evidence
- Arbitrator's decision is binding
- Costs split 50/50

---

## 13. GOVERNING LAW & JURISDICTION

- This SLA is governed by UK law (England & Wales)
- Disputes resolved in UK courts or via arbitration
- Information Commissioner's Office (ICO) can be involved for GDPR disputes

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

*This SLA is binding and effective from May 2, 2026 through May 1, 2028.*

*Version 1.0 | Tier 3 (Enterprise) | Effective May 2, 2026*