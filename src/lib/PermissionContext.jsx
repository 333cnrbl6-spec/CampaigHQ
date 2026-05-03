import React, { createContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState({
    role: 'volunteer',
    tier: 'starter',
    modules: [],
    canAccessAdmin: false,
    canManageTeam: false,
    canAccessReporting: false,
    canManageCampaign: false,
    canAccessDataImport: false,
    canAccessBilling: false,
    email: null,
    loading: true,
    isDeveloper: false
  });

  // CONFIGURE THIS FOR YOUR APP - change to your developer email
  const DEVELOPER_EMAIL = 'developer@yourdomain.com';

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        setPermissions(prev => ({ ...prev, loading: false }));
        return;
      }

      const isDeveloper = user.email === DEVELOPER_EMAIL;
      const roleFromUser = user.role || 'volunteer';
      const tier = user.subscription_tier || 'starter';

      // CUSTOMIZE MODULES BY TIER FOR YOUR APP
      const baseModules = {
        'starter': ['dashboard', 'contacts', 'volunteers', 'map'],
        'professional': ['dashboard', 'contacts', 'volunteers', 'map', 'reporting', 'automation', 'leafleting'],
        'enterprise': ['dashboard', 'contacts', 'volunteers', 'map', 'reporting', 'automation', 'leafleting', 'api', 'integrations', 'advanced_analytics']
      };

      const modules = baseModules[tier] || baseModules.starter;

      setPermissions({
        role: roleFromUser,
        tier,
        modules,
        canAccessAdmin: isDeveloper || roleFromUser === 'admin',
        canManageTeam: roleFromUser === 'campaign_admin' || roleFromUser === 'organizer' || isDeveloper,
        canAccessReporting: tier === 'professional' || tier === 'enterprise' || roleFromUser === 'campaign_admin',
        canManageCampaign: roleFromUser === 'campaign_admin' || isDeveloper,
        canAccessDataImport: tier === 'professional' || tier === 'enterprise' || isDeveloper,
        canAccessBilling: roleFromUser === 'campaign_admin' || isDeveloper,
        email: user.email,
        loading: false,
        isDeveloper
      });
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <PermissionContext.Provider value={{ ...permissions, reloadPermissions: loadPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = React.useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider');
  return ctx;
}