import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { volunteer_id, updates } = body;

    if (!volunteer_id || !updates) {
      return Response.json({ error: 'Missing volunteer_id or updates' }, { status: 400 });
    }

    // Fetch the volunteer profile
    const profile = await base44.asServiceRole.entities.VolunteerProfile.get(volunteer_id);

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Authorization: only volunteer can edit own profile, or organizer
    const canEdit = user.email === profile.user_email || user.role === 'organizer' || user.role === 'admin';
    if (!canEdit) {
      return Response.json({ error: 'You can only edit your own profile' }, { status: 403 });
    }

    // Prevent privilege escalation: volunteers cannot change their own role
    if (user.role === 'user' && updates.role && updates.role !== profile.role) {
      return Response.json({ error: 'Cannot modify your role' }, { status: 403 });
    }

    // Update profile
    const updated = await base44.asServiceRole.entities.VolunteerProfile.update(volunteer_id, updates);

    return Response.json({ profile: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});