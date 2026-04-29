/**
 * Permission system for the campaign app.
 *
 * ROLES (stored on User.role):
 *   admin        — full access, can manage users & roles
 *   organizer    — manages events, shifts, volunteers, imports
 *   canvasser    — field mode, contacts (read + canvass update only)
 *   viewer       — read-only across most of the app
 *
 * PERMISSIONS — boolean capability flags checked via usePermissions / PermissionGate.
 */

export const ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  CANVASSER: 'canvasser',
  VIEWER: 'viewer',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  organizer: 'Organiser',
  canvasser: 'Canvasser',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS = {
  admin: 'Full access — manage users, data, and all features.',
  organizer: 'Manage events, volunteers, imports, and outreach.',
  canvasser: 'Field canvassing — view contacts, log interactions.',
  viewer: 'Read-only access across the app.',
};

/** All permission keys */
export const PERMISSIONS = {
  // Contacts
  CONTACTS_VIEW: 'contacts_view',
  CONTACTS_CREATE: 'contacts_create',
  CONTACTS_EDIT: 'contacts_edit',
  CONTACTS_DELETE: 'contacts_delete',
  CONTACTS_BULK_TAG: 'contacts_bulk_tag',
  CONTACTS_IMPORT: 'contacts_import',

  // Field / Canvassing
  FIELD_MODE: 'field_mode',
  LOG_INTERACTIONS: 'log_interactions',
  CANVASSING_SCRIPTS: 'canvassing_scripts',

  // Events & Volunteers
  EVENTS_VIEW: 'events_view',
  EVENTS_MANAGE: 'events_manage',
  VOLUNTEERS_VIEW: 'volunteers_view',
  VOLUNTEERS_MANAGE: 'volunteers_manage',
  SHIFTS_MANAGE: 'shifts_manage',

  // Maps & Routes
  MAP_VIEW: 'map_view',
  TURF_MANAGE: 'turf_manage',
  LEAFLETS_MANAGE: 'leaflets_manage',
  ROUTE_OPTIMIZER: 'route_optimizer',

  // Outreach & Comms
  OUTREACH_SEND: 'outreach_send',
  OUTREACH_AUTOMATION: 'outreach_automation',
  TEAM_CHAT: 'team_chat',
  SOCIAL_MEDIA: 'social_media',

  // Admin
  REPORTS_VIEW: 'reports_view',
  TASKS_MANAGE: 'tasks_manage',
  ISSUES_MANAGE: 'issues_manage',
  MATERIALS_VIEW: 'materials_view',
  DATA_IMPORT: 'data_import',
  GOTV_VIEW: 'gotv_view',
  USERS_MANAGE: 'users_manage',
  ELECTION_DAY: 'election_day',
};

/** Default permission sets per role */
const ROLE_DEFAULTS = {
  admin: Object.values(PERMISSIONS), // all

  organizer: [
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_CREATE,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.CONTACTS_BULK_TAG,
    PERMISSIONS.CONTACTS_IMPORT,
    PERMISSIONS.FIELD_MODE,
    PERMISSIONS.LOG_INTERACTIONS,
    PERMISSIONS.CANVASSING_SCRIPTS,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_MANAGE,
    PERMISSIONS.VOLUNTEERS_VIEW,
    PERMISSIONS.VOLUNTEERS_MANAGE,
    PERMISSIONS.SHIFTS_MANAGE,
    PERMISSIONS.MAP_VIEW,
    PERMISSIONS.TURF_MANAGE,
    PERMISSIONS.LEAFLETS_MANAGE,
    PERMISSIONS.ROUTE_OPTIMIZER,
    PERMISSIONS.OUTREACH_SEND,
    PERMISSIONS.OUTREACH_AUTOMATION,
    PERMISSIONS.TEAM_CHAT,
    PERMISSIONS.SOCIAL_MEDIA,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.TASKS_MANAGE,
    PERMISSIONS.ISSUES_MANAGE,
    PERMISSIONS.MATERIALS_VIEW,
    PERMISSIONS.DATA_IMPORT,
    PERMISSIONS.GOTV_VIEW,
    PERMISSIONS.ELECTION_DAY,
  ],

  canvasser: [
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.CONTACTS_EDIT,
    PERMISSIONS.FIELD_MODE,
    PERMISSIONS.LOG_INTERACTIONS,
    PERMISSIONS.CANVASSING_SCRIPTS,
    PERMISSIONS.MAP_VIEW,
    PERMISSIONS.TEAM_CHAT,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.VOLUNTEERS_VIEW,
    PERMISSIONS.MATERIALS_VIEW,
    PERMISSIONS.GOTV_VIEW,
  ],

  viewer: [
    PERMISSIONS.CONTACTS_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.VOLUNTEERS_VIEW,
    PERMISSIONS.MAP_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.GOTV_VIEW,
    PERMISSIONS.MATERIALS_VIEW,
    PERMISSIONS.TEAM_CHAT,
  ],
};

/**
 * Given a user object, return their effective permission set.
 * Custom overrides stored on user.custom_permissions (array of granted permission keys)
 * and user.revoked_permissions (array of revoked keys) can fine-tune defaults.
 */
export function resolvePermissions(user) {
  if (!user) return new Set();
  const role = user.role || ROLES.VIEWER;
  const base = new Set(ROLE_DEFAULTS[role] || ROLE_DEFAULTS[ROLES.VIEWER]);

  // Apply custom grants
  if (Array.isArray(user.custom_permissions)) {
    user.custom_permissions.forEach(p => base.add(p));
  }
  // Apply custom revocations
  if (Array.isArray(user.revoked_permissions)) {
    user.revoked_permissions.forEach(p => base.delete(p));
  }

  return base;
}

export function hasPermission(user, permission) {
  return resolvePermissions(user).has(permission);
}