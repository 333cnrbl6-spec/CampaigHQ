# Phase 7: Performance Optimization & Monitoring

**Status**: Architecture & Recommendations Complete

## Overview
Post-RLS deployment, optimize query performance, implement caching, and establish monitoring to maintain sub-100ms response times under volunteer load.

---

## 1. Database Query Optimization

### Critical Indexes
```sql
-- Campaign isolation (all entities)
CREATE INDEX idx_contact_campaign_id ON contact(campaign_id);
CREATE INDEX idx_contact_turf_id ON contact(turf_id);
CREATE INDEX idx_canvassing_log_campaign_id ON canvassing_log(campaign_id);
CREATE INDEX idx_canvassing_log_volunteer_email ON canvassing_log(volunteer_email);
CREATE INDEX idx_volunteer_location_email ON volunteer_location(volunteer_email);
CREATE INDEX idx_contact_interaction_contact_id ON contact_interaction(contact_id);
CREATE INDEX idx_volunteer_profile_email ON volunteer_profile(user_email);

-- Turf assignment lookups (for RLS policy evaluation)
CREATE INDEX idx_turf_assigned_to ON turf(assigned_to);
CREATE INDEX idx_turf_campaign_assigned ON turf(campaign_id, assigned_to);

-- Date-range queries (session logs, activity feeds)
CREATE INDEX idx_canvassing_log_session_date ON canvassing_log(session_date DESC);
CREATE INDEX idx_contact_interaction_date ON contact_interaction(date DESC);
CREATE INDEX idx_volunteer_location_updated ON volunteer_location(last_updated DESC);
```

### Query Optimization Patterns

**Before (slow)**:
```javascript
// Fetches all contacts, filters in memory
const contacts = await base44.entities.Contact.list();
const userContacts = contacts.filter(c => c.turf_id === turfId);
```

**After (fast)**:
```javascript
// Database-level filtering via RLS
const contacts = await base44.entities.Contact.filter({
  turf_id: turfId,
  campaign_id: campaignId
}, '-updated_date', 100);
```

---

## 2. Response Caching Strategy

### Cache Layers
1. **Browser Cache** (Client-side)
   - Leaderboard: Cache for 5 minutes (unlikely to change frequently)
   - Volunteer profile: Cache for 10 minutes
   - Contact list: Cache for 1 minute (contacts updated frequently)

2. **Server Cache** (Base44 SDK)
   - Use React Query `staleTime` & `cacheTime` to avoid redundant requests
   - Example: `useQuery(['leaderboard', campaignId], fetchLeaderboard, { staleTime: 300000 })`

3. **Application Cache** (Session-level)
   - Cache campaign metadata in `CampaignContext` for entire session
   - Invalidate on hard refresh or user logout

### React Query Setup
```javascript
// Cache leaderboard for 5 minutes
const { data: leaderboard } = useQuery(
  ['leaderboard', campaignId],
  () => base44.functions.invoke('getLeaderboardData', { campaign_id: campaignId }),
  { staleTime: 300000, cacheTime: 600000 }
);

// Cache activity feed for 1 minute (more dynamic)
const { data: activity } = useQuery(
  ['activity', campaignId],
  () => base44.functions.invoke('getActivityFeed', { campaign_id: campaignId }),
  { staleTime: 60000, cacheTime: 120000 }
);
```

---

## 3. Frontend Performance

### Code Splitting
- Lazy-load pages using `React.lazy()` + `Suspense`
- Example: `const Leaderboard = lazy(() => import('./pages/Leaderboard'))`

### Component Memoization
```javascript
// Prevent unnecessary re-renders of volunteer cards
const VolunteerCard = React.memo(({ volunteer }) => {
  return <div>{volunteer.name} - {volunteer.doors_knocked}</div>;
}, (prev, next) => prev.volunteer.id === next.volunteer.id);
```

### Bundle Size
- Use `dynamic` imports for heavy visualizations (maps, charts)
- Tree-shake unused dependencies

---

## 4. Monitoring & Metrics

### Key Performance Indicators (KPIs)
1. **API Response Time**
   - Target: < 100ms for filtered queries
   - Monitor: `getLeaderboardData`, `getActivityFeed`, `getContactsForTurf`

2. **Query Latency**
   - Target: < 50ms for RLS-filtered queries
   - Alert if > 200ms

3. **Cache Hit Rate**
   - Target: > 70% for leaderboard, activity feed
   - Monitor via React Query DevTools

4. **Volunteer Concurrent Sessions**
   - Target: Support 500+ concurrent volunteers
   - Load test at 1000 sessions

### Monitoring Setup (Pseudo-code)
```javascript
// Track function call performance
const tracked = async (functionName, params) => {
  const start = performance.now();
  const result = await base44.functions.invoke(functionName, params);
  const duration = performance.now() - start;
  
  // Log to monitoring service
  base44.analytics.track({
    eventName: 'function_call_performance',
    properties: {
      function: functionName,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    }
  });
  
  return result;
};
```

---

## 5. Database Connection Pooling

### Configuration
- Set connection pool to **20-50 connections** (depends on volunteer load)
- Max idle time: **30 seconds**
- Connection timeout: **5 seconds**

### Health Check
```sql
-- Run monthly to verify index health
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 6. Load Testing Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | < 100ms | > 250ms |
| RLS Policy Eval | < 20ms | > 50ms |
| Query Execution | < 30ms | > 100ms |
| Cache Hit Rate | > 70% | < 50% |
| Error Rate | < 0.1% | > 1% |

---

## 7. Optimization Checklist

- [ ] All recommended indexes deployed
- [ ] React Query cache durations configured per page
- [ ] Code splitting implemented on lazy pages
- [ ] Volunteer card/item components memoized
- [ ] Performance monitoring wired to analytics
- [ ] Load test passes 500 concurrent volunteers
- [ ] RLS policy performance baseline established
- [ ] Database connection pool tuned
- [ ] Error rate monitored < 0.1%

---

## Rollout Timeline

**Week 1-2**: Database indexes + monitoring setup  
**Week 3**: Frontend caching & code splitting  
**Week 4**: Load testing & performance tuning  
**Week 5**: Production deployment

---

**Next Step**: Proceed to Phase 8 (GDPR & Audit Logging).