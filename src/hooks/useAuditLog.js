import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';

/**
 * Hook for logging audit events consistently
 */
export const useAuditLog = () => {
  const { campaign } = useCampaign();

  const mutation = useMutation({
    mutationFn: async ({ action, entityType, entityId, changes }) => {
      return base44.functions.invoke('logAuditEvent', {
        campaign_id: campaign?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        changes,
      });
    },
    onError: (err) => {
      console.warn('Audit logging failed (non-critical):', err.message);
    },
  });

  return {
    log: mutation.mutate,
    isLogging: mutation.isPending,
  };
};

export default useAuditLog;