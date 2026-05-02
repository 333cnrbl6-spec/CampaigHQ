/**
 * Authorization Helper Functions
 * 
 * Reusable patterns for user-scoped access control in backend functions.
 * Prevents volunteers from accessing other volunteers' data.
 */

/**
 * Check if user can access their own resource
 * Pattern: Volunteer profile, session logs, shift signups
 */
export function canAccessSelfResource(userEmail, resourceEmail) {
  if (!userEmail || !resourceEmail) return false;
  return userEmail === resourceEmail;
}

/**
 * Check if user has role-based access
 * Pattern: Organizers see all, volunteers see only their own
 */
export function hasRoleBasedAccess(userRole, requiredRoles = []) {
  if (!userRole) return false;
  if (userRole === 'admin') return true; // Admins always have access
  if (userRole === 'organizer') return true; // Organizers always have access
  return requiredRoles.includes(userRole);
}

/**
 * Check if volunteer is assigned to a turf
 * Pattern: Turf access, contact visibility
 */
export function isAssignedToTurf(userEmail, turf) {
  if (!userEmail || !turf) return false;
  
  // Check direct assignment
  if (turf.assigned_to === userEmail) return true;
  
  // Check team assignment
  if (turf.assigned_team && Array.isArray(turf.assigned_team)) {
    return turf.assigned_team.includes(userEmail);
  }
  
  return false;
}

/**
 * Check if team lead can manage a volunteer
 * Pattern: Team lead access control
 */
export function canManageVolunteer(userEmail, userRole, volunteerTeamLeadEmail) {
  if (userRole === 'admin' || userRole === 'organizer') return true;
  if (userRole === 'team_lead' && userEmail === volunteerTeamLeadEmail) return true;
  return false;
}

/**
 * Authorize volunteer access to contact
 * Volunteer can only see contacts in their assigned turfs
 * Pattern: Contact visibility in field mode
 */
export function canAccessContact(userEmail, userRole, contact, userAssignedTurfs = []) {
  // Organizers see all contacts
  if (userRole === 'organizer' || userRole === 'admin') return true;
  
  // Volunteers can only see contacts in assigned turfs
  if (userRole === 'user' || userRole === 'team_lead') {
    return userAssignedTurfs.includes(contact.turf_id);
  }
  
  return false;
}

/**
 * Authorize session log access
 * Volunteers see own logs, team leads see their team's logs, organizers see all
 */
export function canAccessSessionLog(userEmail, userRole, logVolunteerEmail, userManagedVolunteers = []) {
  // Own log
  if (userEmail === logVolunteerEmail) return true;
  
  // Organizers see all
  if (userRole === 'organizer' || userRole === 'admin') return true;
  
  // Team leads see their volunteers' logs
  if (userRole === 'team_lead' && userManagedVolunteers.includes(logVolunteerEmail)) return true;
  
  return false;
}

/**
 * Authorize shift signup access
 * Volunteers can only see/edit own signups
 */
export function canAccessShiftSignup(userEmail, userRole, signupVolunteerEmail) {
  // Own signup
  if (userEmail === signupVolunteerEmail) return true;
  
  // Organizers and team leads can see all
  if (userRole === 'organizer' || userRole === 'admin' || userRole === 'team_lead') return true;
  
  return false;
}

/**
 * Generate authorization error response
 */
export function createForbiddenResponse(message = 'Access denied') {
  return {
    status: 403,
    body: { error: message, code: 'FORBIDDEN' }
  };
}

/**
 * Generate unauthorized error response
 */
export function createUnauthorizedResponse(message = 'Authentication required') {
  return {
    status: 401,
    body: { error: message, code: 'UNAUTHORIZED' }
  };
}

/**
 * Check if user is organizer or admin
 */
export function isOrganizerOrAdmin(userRole) {
  return userRole === 'organizer' || userRole === 'admin';
}

/**
 * Check if user is volunteer (not organizer/admin)
 */
export function isVolunteer(userRole) {
  return userRole === 'user' || userRole === 'team_lead';
}