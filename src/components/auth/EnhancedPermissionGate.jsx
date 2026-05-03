import React from 'react';
import { usePermissions } from '@/lib/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function PermissionGate({ 
  children, 
  requiredRole = null,
  requiredTier = null,
  requiredModule = null,
  fallback = null
}) {
  const permissions = usePermissions();

  if (permissions.loading) {
    return <div className="flex items-center justify-center p-8">Loading permissions...</div>;
  }

  // Check role requirement
  if (requiredRole) {
    const roleHierarchy = {
      'volunteer': 0,
      'organizer': 1,
      'campaign_admin': 2,
      'admin': 3
    };
    
    const userLevel = roleHierarchy[permissions.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    if (userLevel < requiredLevel && !permissions.isDeveloper) {
      return fallback || <LockedFeature reason={`Requires ${requiredRole} access`} />;
    }
  }

  // Check tier requirement
  const tierHierarchy = { 'starter': 0, 'professional': 1, 'enterprise': 2 };
  if (requiredTier && tierHierarchy[permissions.tier] < tierHierarchy[requiredTier]) {
    return fallback || <LockedFeature reason={`Requires ${requiredTier} subscription`} />;
  }

  // Check module requirement
  if (requiredModule && !permissions.modules.includes(requiredModule)) {
    return fallback || <LockedFeature reason={`Module not available in your plan`} />;
  }

  return children;
}

function LockedFeature({ reason }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Lock className="w-5 h-5" />
          Feature Unavailable
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-amber-800">{reason}</p>
      </CardContent>
    </Card>
  );
}