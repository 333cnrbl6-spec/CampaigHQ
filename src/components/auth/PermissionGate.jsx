import React from 'react';
import { useCampaign } from '@/lib/CampaignContext';
import { AlertCircle } from 'lucide-react';

export default function PermissionGate({ requiredRole, children, fallback = null }) {
  const { userRole } = useCampaign();

  // Role hierarchy
  const roleHierarchy = {
    campaign_admin: 3,
    organizer: 2,
    volunteer: 1,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  if (userLevel >= requiredLevel) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-900">Access Restricted</p>
        <p className="text-xs text-amber-700 mt-1">You need {requiredRole} access to view this.</p>
      </div>
    </div>
  );
}