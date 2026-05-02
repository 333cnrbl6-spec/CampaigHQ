import { useCampaign } from '@/lib/CampaignContext';
import { canAccess } from '@/lib/permissions';
import { AlertCircle } from 'lucide-react';

/**
 * Component that conditionally renders based on user permissions
 * Shows fallback content if user doesn't have access
 */
export default function PermissionGate({
  entityType,
  action = 'read',
  children,
  fallback = null,
}) {
  const { userRole } = useCampaign();

  if (!userRole) {
    return fallback || (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        Loading permissions...
      </div>
    );
  }

  if (!canAccess(userRole, entityType, action)) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        You don't have permission to {action} {entityType}.
      </div>
    );
  }

  return children;
}