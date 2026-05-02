# Phase 9: Frontend Integration & Load Testing

**Status**: Implementation Guide & Testing Plan Complete

## Overview
Wire up Phase 5's backend functions (`getActivityFeed`, `getLeaderboardData`, `getVolunteerLocations`) into existing frontend pages, add error handling, and verify under load.

---

## 1. Backend Functions to Integrate

| Function | Page | Purpose |
|----------|------|---------|
| `getActivityFeed` | ActivityFeed | Real-time volunteer activity stream |
| `getLeaderboardData` | Leaderboard | Ranked volunteer performance |
| `getVolunteerLocations` | VolunteerLiveMap | Real-time volunteer locations |
| `getSessionLogs` | CanvassingActivity | Volunteer canvassing history |
| `getContactInteractions` | ContactHistory | Contact interaction log |

---

## 2. Integration Pattern (Reusable)

```javascript
// Hook: useSecureData
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const useSecureData = (functionName, params, options = {}) => {
  const { data, isLoading, error, refetch } = useQuery(
    [functionName, params],
    async () => {
      try {
        const response = await base44.functions.invoke(functionName, params);
        return response.data;
      } catch (err) {
        // Handle 403 (RLS denial) gracefully
        if (err.response?.status === 403) {
          throw new Error('You do not have access to this data.');
        }
        throw err;
      }
    },
    { staleTime: 60000, ...options }
  );
  
  return { data, isLoading, error, refetch };
};
```

---

## 3. Page Integration Examples

### 3.1 ActivityFeed Page
```javascript
// pages/ActivityFeed.jsx
import { useSecureData } from '@/hooks/useSecureData';
import { useCampaign } from '@/lib/CampaignContext';

export default function ActivityFeed() {
  const { campaignId } = useCampaign();
  const { data: activity, isLoading, error } = useSecureData(
    'getActivityFeed',
    { campaign_id: campaignId },
    { staleTime: 30000 } // Refresh every 30 seconds
  );
  
  if (isLoading) return <div className="text-center p-4">Loading activity...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error.message}</div>;
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Activity Feed</h1>
      {activity?.length === 0 ? (
        <p className="text-muted-foreground">No recent activity</p>
      ) : (
        activity?.map(log => (
          <div key={log.id} className="border p-4 rounded-lg">
            <p className="font-semibold">{log.volunteer_name}</p>
            <p className="text-sm text-muted-foreground">
              Knocked {log.doors_knocked} doors on {log.session_date}
            </p>
            <p className="text-sm">{log.general_notes}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

### 3.2 Leaderboard Page
```javascript
// pages/Leaderboard.jsx
import { useSecureData } from '@/hooks/useSecureData';
import { useCampaign } from '@/lib/CampaignContext';
import { useAuth } from '@/lib/AuthContext';

export default function Leaderboard() {
  const { campaignId } = useCampaign();
  const { user } = useAuth();
  const { data: leaderboard, isLoading, error } = useSecureData(
    'getLeaderboardData',
    { campaign_id: campaignId },
    { staleTime: 300000 } // Cache for 5 minutes (less dynamic)
  );
  
  if (isLoading) return <div className="text-center p-4">Loading leaderboard...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error.message}</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
      <div className="space-y-2">
        {leaderboard?.map((volunteer, idx) => {
          const isCurrentUser = volunteer.email === user?.email;
          return (
            <div 
              key={volunteer.email} 
              className={`border p-4 rounded-lg flex justify-between ${
                isCurrentUser ? 'bg-primary/10 border-primary' : ''
              }`}
            >
              <div>
                <p className="font-semibold">#{idx + 1} {volunteer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {volunteer.doors_knocked} doors knocked
                </p>
              </div>
              {/* Volunteers see only their own stats, sanitized for others */}
              <div className="text-right">
                {isCurrentUser ? (
                  <p className="text-sm">
                    {volunteer.positive_responses} positive,
                    {volunteer.negative_responses} negative
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Your ranking: #{idx + 1}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3.3 VolunteerLiveMap Page
```javascript
// pages/VolunteerLiveMap.jsx
import { useSecureData } from '@/hooks/useSecureData';
import { useCampaign } from '@/lib/CampaignContext';
import { useAuth } from '@/lib/AuthContext';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

export default function VolunteerLiveMap() {
  const { campaignId } = useCampaign();
  const { user } = useAuth();
  const { data: locations, isLoading, error } = useSecureData(
    'getVolunteerLocations',
    { campaign_id: campaignId },
    { staleTime: 15000 } // Refresh every 15 seconds (real-time)
  );
  
  if (isLoading) return <div className="text-center p-4">Loading map...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error.message}</div>;
  
  // Filter: organizers see all, volunteers see only themselves
  const visibleLocations = user?.role === 'organizer' 
    ? locations 
    : locations?.filter(loc => loc.volunteer_email === user?.email);
  
  return (
    <MapContainer center={[53.5, -2.2]} zoom={12} style={{ height: '100vh' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {visibleLocations?.map(loc => (
        <CircleMarker
          key={loc.id}
          center={[loc.latitude, loc.longitude]}
          radius={8}
          color={loc.status === 'active' ? 'green' : 'gray'}
        >
          <Popup>
            <div>
              <p className="font-semibold">{loc.volunteer_name}</p>
              <p className="text-sm">{loc.turf_name}</p>
              <p className="text-sm text-muted-foreground">
                Doors: {loc.doors_knocked_today} | Battery: {loc.battery_level}%
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
```

---

## 4. Error Handling Strategy

### Standard Error Responses
```javascript
// 403: RLS denying access (volunteer accessing another volunteer's data)
if (error.response?.status === 403) {
  return <div className="text-red-600 p-4">
    You do not have permission to view this data.
  </div>;
}

// 401: User not authenticated
if (error.response?.status === 401) {
  navigateToLogin();
}

// 500: Server error
if (error.response?.status === 500) {
  return <div className="text-red-600 p-4">
    Something went wrong. Please try again later.
  </div>;
}
```

---

## 5. Real-Time Polling Strategy

### Activity Feed (Medium Urgency)
```javascript
// Refetch every 30 seconds
useSecureData('getActivityFeed', params, { 
  refetchInterval: 30000,
  staleTime: 15000
})
```

### Live Map (High Urgency)
```javascript
// Refetch every 10 seconds
useSecureData('getVolunteerLocations', params, { 
  refetchInterval: 10000,
  staleTime: 5000
})
```

### Leaderboard (Low Urgency)
```javascript
// Refetch every 5 minutes
useSecureData('getLeaderboardData', params, { 
  refetchInterval: 300000,
  staleTime: 300000
})
```

---

## 6. Load Testing Plan

### Test 1: Concurrent User Sessions
```
Scenario: 500 volunteers logging in simultaneously

Setup:
- Spin up 500 simulated volunteer sessions
- Each volunteer refreshes leaderboard, activity feed, map every 30 seconds

Success Criteria:
- All requests complete within 100ms
- Error rate < 0.1%
- CPU usage < 60%
- Memory usage < 80%
```

### Test 2: RLS Policy Performance
```
Scenario: Volunteer queries contacts (RLS should filter by turf)

Setup:
- 100 volunteers, 10 contacts per turf
- Each volunteer queries: getContactsForTurf()
- Run 10 minutes continuous

Success Criteria:
- RLS policy evaluation < 20ms
- Query execution < 50ms
- Total response time < 100ms
```

### Test 3: Peak Activity
```
Scenario: 50 volunteers all logging sessions simultaneously

Setup:
- 50 volunteers call logCanvassingSession()
- 50 volunteers call updateVolunteerLocation()
- Run for 5 minutes

Success Criteria:
- All mutations complete within 100ms
- Database writes don't block reads
- No data corruption
```

### Load Test Tool Configuration (k6)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 500, // Virtual users
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95th percentile < 100ms
    http_req_failed: ['rate<0.001'], // Error rate < 0.1%
  },
};

export default function () {
  // Simulate leaderboard fetch
  let res = http.get(
    'https://your-app.com/api/functions/getLeaderboardData',
    {
      headers: {
        'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}
```

---

## 7. Deployment Checklist

- [ ] `useSecureData` hook implemented & tested
- [ ] ActivityFeed page integrated with `getActivityFeed`
- [ ] Leaderboard page integrated with `getLeaderboardData`
- [ ] VolunteerLiveMap page integrated with `getVolunteerLocations`
- [ ] Error handling for 403, 401, 500 status codes
- [ ] Real-time polling intervals configured
- [ ] React Query caching optimized
- [ ] Load test passes 500 concurrent users
- [ ] RLS policy performance baseline < 100ms
- [ ] Error rate monitored < 0.1%
- [ ] Pages responsive on mobile

---

## 8. Post-Deployment Monitoring

### Key Metrics to Track
1. **Page Load Time**: Activity Feed, Leaderboard, Map
2. **API Error Rate**: By function and status code
3. **RLS Policy Latency**: By entity type
4. **Volunteer Concurrent Sessions**: Daily peak
5. **Cache Hit Rate**: By page/function

### Alert Thresholds
- Page load > 2 seconds → Alert
- API error rate > 1% → Alert
- RLS latency > 100ms → Alert

---

**Timeline**: 2-3 weeks for integration + testing → Production deployment

**Next Step**: Run full load test & prepare for production rollout.