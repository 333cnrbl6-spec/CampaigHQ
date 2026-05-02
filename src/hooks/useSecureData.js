import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * Hook for securely fetching data from RLS-protected backend functions
 * Handles 403 access denials gracefully and logs access attempts
 */
export const useSecureData = (functionName, params, options = {}) => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [functionName, JSON.stringify(params)],
    queryFn: async () => {
      if (!functionName || !params) {
        throw new Error('Function name and params are required');
      }
      
      try {
        const response = await base44.functions.invoke(functionName, params);
        
        // Ensure response has expected structure
        const result = response?.data ?? null;
        if (!Array.isArray(result) && result !== null) {
          console.warn(`Expected array or null from ${functionName}, got:`, typeof result);
          return Array.isArray(result) ? result : [];
        }
        
        // Log successful data access
        try {
          base44.analytics.track({
            eventName: 'secure_data_access',
            properties: {
              function: functionName,
              status: 'success',
              user_email: user?.email
            }
          });
        } catch (trackErr) {
          console.warn('Analytics tracking failed:', trackErr);
        }
        
        return result || [];
      } catch (err) {
        // Handle 403 (RLS denial) gracefully
        if (err.response?.status === 403) {
          try {
            base44.analytics.track({
              eventName: 'secure_data_access',
              properties: {
                function: functionName,
                status: 'denied',
                user_email: user?.email
              }
            });
          } catch (trackErr) {
            console.warn('Analytics tracking failed:', trackErr);
          }
          
          throw new Error('You do not have access to this data.');
        }
        
        // Handle 401 (not authenticated)
        if (err.response?.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        
        console.error(`useSecureData error in ${functionName}:`, err);
        throw err;
      }
    },
    staleTime: 60000, // Default 1 minute
    gcTime: 120000, // Renamed from cacheTime in v5
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!(user && params && functionName), // Only run if user, params, and functionName present
    ...options
  });

  return {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    isError: !!error
  };
};

export default useSecureData;