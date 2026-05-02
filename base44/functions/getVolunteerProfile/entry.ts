import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Authorization helpers (inlined for serverless deployment)
function canAccessSelfResource(userEmail, resourceEmail) {
  if (!userEmail || !resourceEmail) return false;
  return userEmail === resourceEmail;
}

function isOrganizerOrAdmin(userRole) {
  return userRole === 'organizer' || userRole === 'admin';
}

function createForbiddenResponse(message = 'Access denied') {
  return {
    status: 403,
    body: { error: message, code: 'FORBIDDEN' }
  };
}

function createUnauthorizedResponse(message = 'Authentication required') {
  return {
    status: 401,
    body: { error: message, code: 'UNAUTHORIZED' }
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(createUnauthorizedResponse(), { status: 401 });
    }

    const body = await req.json();
    const { volunteer_email } = body;

    if (!volunteer_email) {
      return Response.json({ error: 'Missing volunteer_email' }, { status: 400 });
    }

    // Check authorization: self-access or organizer
    if (!canAccessSelfResource(user.email, volunteer_email) && !isOrganizerOrAdmin(user.role)) {
      return Response.json(createForbiddenResponse('You can only view your own profile'), { status: 403 });
    }

    // Fetch volunteer profile
    const profile = await base44.asServiceRole.entities.VolunteerProfile.filter(
      { user_email: volunteer_email },
      null,
      1
    );

    if (!profile || profile.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    return Response.json({ profile: profile[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});