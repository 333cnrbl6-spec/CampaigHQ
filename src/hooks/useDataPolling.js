import { useEffect } from 'react';
import { useSecureData } from './useSecureData';

/**
 * Configure real-time polling intervals for different data types
 * Balances freshness vs. performance
 */
const POLLING_CONFIG = {
  activity_feed: { staleTime: 30000, refetchInterval: 30000 }, // 30s refresh
  leaderboard: { staleTime: 300000, refetchInterval: 300000 }, // 5m refresh
  volunteer_locations: { staleTime: 15000, refetchInterval: 10000 }, // 10s refresh
  session_logs: { staleTime: 60000, refetchInterval: 60000 }, // 1m refresh
  contact_details: { staleTime: 120000, refetchInterval: null }, // 2m cache, no polling
};

/**
 * Hook for data with automatic polling based on type
 */
export const useDataPolling = (functionName, params, dataType = 'default') => {
  const config = POLLING_CONFIG[dataType] || { staleTime: 60000, refetchInterval: null };
  
  const { data, isLoading, error, refetch, isFetching } = useSecureData(
    functionName,
    params,
    config
  );

  return { data, isLoading, error, refetch, isFetching };
};

export default useDataPolling;