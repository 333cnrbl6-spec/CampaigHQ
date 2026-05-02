import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Admin function to manage campaign memberships
 * Only campaign_admin or national_admin can call this
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, campaign_id, target_user_email, role } = body;

    // Verify user has permission to manage this campaign
    const userMembership = currentUser.campaign_memberships?.find(
      m => m.campaign_id === campaign_id && m.status === 'active'
    );
    
    if (!userMembership || !['campaign_admin', 'organiser'].includes(userMembership.role)) {
      // National admin can manage any campaign
      if (currentUser.role !== 'admin') {
        return Response.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    if (action === 'add_member') {
      if (!target_user_email || !role) {
        return Response.json({ error: 'Missing target_user_email or role' }, { status: 400 });
      }

      // Find target user
      const allUsers = await base44.entities.User.list('email', 10000);
      const targetUser = allUsers.find(u => u.email === target_user_email);
      
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if already a member
      if (targetUser.campaign_memberships?.some(m => m.campaign_id === campaign_id && m.status === 'active')) {
        return Response.json({ error: 'User is already a member' }, { status: 400 });
      }

      // Add to campaign
      const updatedMemberships = [
        ...(targetUser.campaign_memberships || []),
        {
          campaign_id,
          role,
          added_date: new Date().toISOString(),
          status: 'active',
        },
      ];

      await base44.entities.User.update(targetUser.id, {
        campaign_memberships: updatedMemberships,
      });

      return Response.json({
        success: true,
        message: `Added ${target_user_email} as ${role}`,
      });
    }

    if (action === 'remove_member') {
      if (!target_user_email) {
        return Response.json({ error: 'Missing target_user_email' }, { status: 400 });
      }

      const allUsers = await base44.entities.User.list('email', 10000);
      const targetUser = allUsers.find(u => u.email === target_user_email);
      
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      // Mark membership as removed
      const updatedMemberships = (targetUser.campaign_memberships || []).map(m =>
        m.campaign_id === campaign_id ? { ...m, status: 'removed' } : m
      );

      await base44.entities.User.update(targetUser.id, {
        campaign_memberships: updatedMemberships,
      });

      return Response.json({
        success: true,
        message: `Removed ${target_user_email} from campaign`,
      });
    }

    if (action === 'change_role') {
      if (!target_user_email || !role) {
        return Response.json({ error: 'Missing target_user_email or role' }, { status: 400 });
      }

      const allUsers = await base44.entities.User.list('email', 10000);
      const targetUser = allUsers.find(u => u.email === target_user_email);
      
      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      // Update role in membership
      const updatedMemberships = (targetUser.campaign_memberships || []).map(m =>
        m.campaign_id === campaign_id ? { ...m, role } : m
      );

      await base44.entities.User.update(targetUser.id, {
        campaign_memberships: updatedMemberships,
      });

      return Response.json({
        success: true,
        message: `Changed ${target_user_email} role to ${role}`,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});