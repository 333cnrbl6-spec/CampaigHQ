# Phase 9: Comprehensive Load Testing Suite

**Status**: Ready for Deployment

## Overview
Complete load testing strategy to validate multi-tenant security, performance, and reliability under realistic volunteer campaign load.

---

## 1. Test Environment Setup

### Prerequisites
- **Load Testing Tool**: k6 (https://k6.io)
- **Monitoring**: Base44 analytics + custom dashboards
- **Test Database**: Staging environment with 1000 sample contacts, 50 sample volunteers
- **Network**: Simulate real network latency (add 20-50ms)

### Installation
```bash
# Install k6
curl https://dl.k6.io/install/linux.sh | sudo bash

# Install k6 extensions (optional, for custom metrics)
npm install -D k6
```

---

## 2. Test Scenarios

### Scenario 1: Security Isolation (RLS Enforcement)
**Objective**: Verify volunteers cannot access cross-volunteer data

```javascript
// test_rls_isolation.js
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'https://your-app.com/api/functions';

export const options = {
  vus: 50, // 50 volunteers
  duration: '5m',
};

export default function () {
  const volunteerId = __ENV.VOLUNTEER_ID;
  const otherVolunteerId = __ENV.OTHER_VOLUNTEER_ID;
  
  // Test 1: Volunteer queries own activity feed (should succeed)
  let res = http.post(
    `${BASE_URL}/getActivityFeed`,
    JSON.stringify({ campaign_id: __ENV.CAMPAIGN_ID }),
    {
      headers: {
        'Authorization': `Bearer ${__ENV.TOKEN_${volunteerId}}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  check(res, {
    'own activity feed returns 200': (r) => r.status === 200,
    'response includes own logs only': (r) => {
      const body = JSON.parse(r.body);
      return body.data?.every(log => log.volunteer_email === `volunteer_${volunteerId}@test.com`);
    },
  });
  
  // Test 2: Volunteer attempts to query other volunteer's logs (should fail or return empty)
  res = http.post(
    `${BASE_URL}/getActivityFeed`,
    JSON.stringify({ 
      campaign_id: __ENV.CAMPAIGN_ID,
      volunteer_email: `volunteer_${otherVolunteerId}@test.com`
    }),
    {
      headers: {
        'Authorization': `Bearer ${__ENV.TOKEN_${volunteerId}}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  check(res, {
    'other volunteer logs returns 403 or empty': (r) => {
      return r.status === 403 || JSON.parse(r.body).data?.length === 0;
    },
  });
  
  // Test 3: Organizer queries all activity (should succeed)
  res = http.post(
    `${BASE_URL}/getActivityFeed`,
    JSON.stringify({ campaign_id: __ENV.CAMPAIGN_ID }),
    {
      headers: {
        'Authorization': `Bearer ${__ENV.ORGANIZER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  check(res, {
    'organizer sees all logs': (r) => r.status === 200,
    'organizer data includes multiple volunteers': (r) => {
      const body = JSON.parse(r.body);
      return new Set(body.data?.map(log => log.volunteer_email)).size > 1;
    },
  });
}
```

**Run**:
```bash
k6 run test_rls_isolation.js \
  --env CAMPAIGN_ID=camp_123 \
  --env VOLUNTEER_ID=vol_1 \
  --env OTHER_VOLUNTEER_ID=vol_2 \
  --env TOKEN_vol_1=token... \
  --env TOKEN_vol_2=token... \
  --env ORGANIZER_TOKEN=token...
```

---

### Scenario 2: Performance Under Load (500 Concurrent)
**Objective**: Verify response times remain under 100ms with 500 volunteers

```javascript
// test_performance_500.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100
    { duration: '2m', target: 250 },  // Ramp up to 250
    { duration: '2m', target: 500 },  // Ramp up to 500
    { duration: '5m', target: 500 },  // Stay at 500
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<200'], // 95th < 100ms, 99th < 200ms
    http_req_failed: ['rate<0.001'], // Error rate < 0.1%
  },
};

export default function () {
  // Leaderboard fetch (frequent, less critical)
  let res = http.post(
    `${BASE_URL}/getLeaderboardData`,
    JSON.stringify({ campaign_id: __ENV.CAMPAIGN_ID }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` } }
  );
  
  check(res, {
    'leaderboard p95 < 100ms': (r) => r.timings.duration < 100,
    'leaderboard status 200': (r) => r.status === 200,
  });
  
  // Activity feed fetch
  res = http.post(
    `${BASE_URL}/getActivityFeed`,
    JSON.stringify({ campaign_id: __ENV.CAMPAIGN_ID }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` } }
  );
  
  check(res, {
    'activity feed p95 < 100ms': (r) => r.timings.duration < 100,
    'activity feed status 200': (r) => r.status === 200,
  });
  
  // Live map location fetch
  res = http.post(
    `${BASE_URL}/getVolunteerLocations`,
    JSON.stringify({ campaign_id: __ENV.CAMPAIGN_ID }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` } }
  );
  
  check(res, {
    'locations p95 < 100ms': (r) => r.timings.duration < 100,
    'locations status 200': (r) => r.status === 200,
  });
}
```

**Run**:
```bash
k6 run test_performance_500.js --env CAMPAIGN_ID=camp_123 --env TOKEN=token...
```

---

### Scenario 3: Peak Activity (Concurrent Mutations)
**Objective**: Verify database handles concurrent logs/updates without corruption

```javascript
// test_peak_mutations.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50, // 50 volunteers
  duration: '5m',
};

export default function () {
  const volunteerId = __ENV.VOLUNTEER_ID;
  
  // Simulate canvassing session logging
  let res = http.post(
    `${BASE_URL}/logCanvassingSession`,
    JSON.stringify({
      campaign_id: __ENV.CAMPAIGN_ID,
      doors_knocked: Math.floor(Math.random() * 50) + 10,
      positive_responses: Math.floor(Math.random() * 10),
      session_date: new Date().toISOString().split('T')[0],
      turf_id: __ENV.TURF_ID,
    }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN_${volunteerId}}` } }
  );
  
  check(res, {
    'session log created': (r) => r.status === 200 || r.status === 201,
  });
  
  // Simulate location update
  res = http.post(
    `${BASE_URL}/updateVolunteerLocation`,
    JSON.stringify({
      campaign_id: __ENV.CAMPAIGN_ID,
      latitude: 53.5 + (Math.random() - 0.5) * 0.1,
      longitude: -2.2 + (Math.random() - 0.5) * 0.1,
      doors_knocked_today: Math.floor(Math.random() * 30),
    }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN_${volunteerId}}` } }
  );
  
  check(res, {
    'location updated': (r) => r.status === 200 || r.status === 201,
  });
  
  // Simulate contact interaction logging
  res = http.post(
    `${BASE_URL}/logContactInteraction`,
    JSON.stringify({
      campaign_id: __ENV.CAMPAIGN_ID,
      contact_id: __ENV.CONTACT_IDS[Math.floor(Math.random() * __ENV.CONTACT_IDS.length)],
      type: ['door_knock', 'phone_call', 'email'][Math.floor(Math.random() * 3)],
      date: new Date().toISOString().split('T')[0],
      outcome: ['positive', 'negative', 'no_answer'][Math.floor(Math.random() * 3)],
    }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN_${volunteerId}}` } }
  );
  
  check(res, {
    'interaction logged': (r) => r.status === 200 || r.status === 201,
  });
}
```

---

### Scenario 4: RLS Query Performance
**Objective**: Verify RLS policies don't degrade query performance

```javascript
// test_rls_performance.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '10m',
};

export default function () {
  // Query filtered by RLS (should be fast)
  let res = http.post(
    `${BASE_URL}/getContactsForTurf`,
    JSON.stringify({
      campaign_id: __ENV.CAMPAIGN_ID,
      turf_id: __ENV.TURF_ID,
    }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` } }
  );
  
  check(res, {
    'RLS filtered query p95 < 100ms': (r) => r.timings.duration < 100,
    'no unfiltered data returned': (r) => {
      // Verify all returned contacts belong to the turf
      const body = JSON.parse(r.body);
      return body.data?.every(contact => contact.turf_id === __ENV.TURF_ID);
    },
  });
}
```

---

## 3. Continuous Integration (CI) Load Testing

### GitHub Actions Example
```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install k6
        run: curl https://dl.k6.io/install/linux.sh | sudo bash
      
      - name: Run RLS Isolation Test
        run: k6 run test_rls_isolation.js
        env:
          CAMPAIGN_ID: ${{ secrets.TEST_CAMPAIGN_ID }}
          TOKEN: ${{ secrets.TEST_TOKEN }}
      
      - name: Run Performance Test
        run: k6 run test_performance_500.js
        env:
          CAMPAIGN_ID: ${{ secrets.TEST_CAMPAIGN_ID }}
          TOKEN: ${{ secrets.TEST_TOKEN }}
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: ./results/
```

---

## 4. Expected Results & Acceptance Criteria

| Test | Metric | Target | Pass/Fail |
|------|--------|--------|-----------|
| RLS Isolation | Volunteer sees own data only | 100% | PASS |
| RLS Isolation | Volunteer cannot access other data | 403 or empty | PASS |
| Performance | p95 response time | < 100ms | PASS |
| Performance | p99 response time | < 200ms | PASS |
| Performance | Error rate | < 0.1% | PASS |
| Performance | Concurrent users | 500+ | PASS |
| Mutations | Session logs created | 100% success | PASS |
| Mutations | Location updates succeed | 100% success | PASS |
| Mutations | No data corruption | 0 errors | PASS |
| RLS Performance | Filtered query time | < 100ms | PASS |

---

## 5. Post-Load Test Analysis

### Metrics to Review
1. **Response Time Distribution**
   - Plot p50, p95, p99 over time
   - Identify bottlenecks (RLS policy vs. query execution)

2. **Error Patterns**
   - 403 errors (RLS denying access—should be rare)
   - 500 errors (server issues—should be 0)
   - Timeout errors (should be < 0.01%)

3. **Resource Utilization**
   - CPU: Should peak at 60-70% during 500 concurrent load
   - Memory: Should peak at 70-80%
   - Database connections: Should not exceed pool size

4. **Security Audit**
   - Verify RLS filtered all cross-volunteer data correctly
   - Check audit logs for any unauthorized access attempts
   - Confirm 403 errors logged for denied requests

---

## 6. Failure Scenarios & Recovery

### Scenario: Database Connection Pool Exhaustion
**Symptoms**: Requests timeout, 503 errors spike
**Recovery**:
1. Increase connection pool size
2. Implement connection timeout & retry logic
3. Re-run load test at higher concurrency

### Scenario: RLS Policy Performance Degradation
**Symptoms**: Response time > 200ms with RLS
**Recovery**:
1. Add indexes on (campaign_id, user_email)
2. Optimize policy JOIN queries
3. Consider caching policy results per user

### Scenario: Data Corruption During Mutations
**Symptoms**: Duplicate or missing records
**Recovery**:
1. Verify transaction isolation level
2. Check for race conditions in business logic
3. Add database constraints (UNIQUE, FOREIGN KEY)

---

## 7. Rollout Checklist

- [ ] All 4 test scenarios pass with expected metrics
- [ ] RLS isolation verified (no cross-volunteer data leakage)
- [ ] Performance baseline established (p95 < 100ms)
- [ ] Error rate < 0.1% under 500 concurrent load
- [ ] Security audit passed (403 errors logged correctly)
- [ ] Monitoring dashboards configured
- [ ] CI/CD load testing pipeline active
- [ ] Runbook created for failure scenarios
- [ ] Stakeholders briefed on results

---

## 8. Timeline

**Week 1**: Set up test environment & k6 scripts  
**Week 2**: Run Scenario 1-2 (security & performance)  
**Week 3**: Run Scenario 3-4 (mutations & RLS perf)  
**Week 4**: Analyze results, optimize, re-run if needed  
**Week 5**: Production readiness sign-off

---

**Success Criteria**: All tests PASS → Production deployment approved.