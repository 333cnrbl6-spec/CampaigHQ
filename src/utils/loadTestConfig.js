/**
 * Load testing configuration & utilities
 * Used for Phase 9 performance validation
 */

export const LOAD_TEST_TARGETS = {
  api_response_time: {
    p95: 100, // milliseconds
    p99: 200,
    alert_threshold: 250
  },
  rls_policy_latency: {
    target: 20,
    alert_threshold: 50
  },
  error_rate: {
    target: 0.001, // 0.1%
    alert_threshold: 0.01 // 1%
  },
  concurrent_users: 500,
  cache_hit_rate: 0.70 // 70%
};

export const POLLING_INTERVALS = {
  activity_feed: 30000, // 30 seconds
  leaderboard: 300000, // 5 minutes
  volunteer_locations: 10000, // 10 seconds
  session_logs: 60000, // 1 minute
  contact_details: 120000, // 2 minutes
};

export const CACHE_DURATIONS = {
  short: { staleTime: 30000, cacheTime: 60000 },
  medium: { staleTime: 60000, cacheTime: 120000 },
  long: { staleTime: 300000, cacheTime: 600000 },
  no_cache: { staleTime: 0, cacheTime: 0 }
};

/**
 * Performance monitoring wrapper
 * Tracks response times & logs slow requests
 */
export const trackPerformance = async (functionName, fn) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Log slow requests
    if (duration > LOAD_TEST_TARGETS.api_response_time.alert_threshold) {
      console.warn(`[PERF] ${functionName} took ${duration.toFixed(0)}ms (threshold: ${LOAD_TEST_TARGETS.api_response_time.alert_threshold}ms)`);
    }
    
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF ERROR] ${functionName} failed after ${duration.toFixed(0)}ms:`, error.message);
    throw error;
  }
};

/**
 * Simulate network latency for testing
 */
export const addNetworkLatency = (ms = 20) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export default {
  LOAD_TEST_TARGETS,
  POLLING_INTERVALS,
  CACHE_DURATIONS,
  trackPerformance,
  addNetworkLatency
};