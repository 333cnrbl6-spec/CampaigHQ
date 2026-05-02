/**
 * Permission checking utilities for role-based access control
 * Roles: volunteer, organiser, campaign_admin, national_admin
 */

const PERMISSIONS = {
  volunteer: {
    contacts: ['read'],
    turfs: ['read'],
    canvassing_logs: ['create', 'read'],
    interactions: ['create', 'read'],
    tasks: ['read'],
    events: ['read'],
    leaflet_runs: ['read'],
    shifts: ['read'],
  },
  organiser: {
    contacts: ['create', 'read', 'update', 'delete'],
    turfs: ['create', 'read', 'update', 'delete'],
    canvassing_logs: ['create', 'read', 'update'],
    interactions: ['create', 'read', 'update'],
    tasks: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    leaflet_runs: ['create', 'read', 'update', 'delete'],
    shifts: ['create', 'read', 'update', 'delete'],
    volunteers: ['read', 'update'], // manage volunteer assignments
    campaign_settings: ['read', 'update'],
  },
  campaign_admin: {
    contacts: ['create', 'read', 'update', 'delete'],
    turfs: ['create', 'read', 'update', 'delete'],
    canvassing_logs: ['create', 'read', 'update'],
    interactions: ['create', 'read', 'update'],
    tasks: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    leaflet_runs: ['create', 'read', 'update', 'delete'],
    shifts: ['create', 'read', 'update', 'delete'],
    volunteers: ['create', 'read', 'update', 'delete'],
    campaign_settings: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
  },
  national_admin: {
    all: ['create', 'read', 'update', 'delete'], // Full access to all data
  },
};

export function canAccess(userRole, entityType, action) {
  // National admin has full access
  if (userRole === 'national_admin') return true;

  const rolePerms = PERMISSIONS[userRole];
  if (!rolePerms) return false;

  // If role has 'all' access, allow any action
  if (rolePerms.all && rolePerms.all.includes(action)) return true;

  // Check specific entity permissions
  const entityPerms = rolePerms[entityType];
  return entityPerms && entityPerms.includes(action);
}

export function resolvePermissions(user) {
  if (!user) return new Set();
  const perms = new Set();
  
  if (user.role === 'admin') {
    // Admin has all permissions
    perms.add('admin');
  }
  
  return perms;
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const perms = resolvePermissions(user);
  return perms.has(permission);
}

export function requiresPermission(userRole, entityType, action) {
  if (!canAccess(userRole, entityType, action)) {
    throw new Error(`Permission denied: ${userRole} cannot ${action} ${entityType}`);
  }
}

export const ROLE_LABELS = {
  volunteer: 'Volunteer',
  organiser: 'Campaign Organiser',
  campaign_admin: 'Campaign Admin',
  national_admin: 'National Admin',
};