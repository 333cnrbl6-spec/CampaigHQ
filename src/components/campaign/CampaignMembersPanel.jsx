import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/permissions';

export default function CampaignMembersPanel() {
  const { campaign, userRole } = useCampaign();
  const queryClient = useQueryClient();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('volunteer');

  // Check if current user is admin-level
  const canManage = ['campaign_admin', 'organiser'].includes(userRole);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('email', 10000),
  });

  // Get campaign members
  const campaignMembers = allUsers
    .filter(u =>
      u.campaign_memberships?.some(m => m.campaign_id === campaign?.id && m.status === 'active')
    )
    .map(u => {
      const membership = u.campaign_memberships.find(m => m.campaign_id === campaign?.id);
      return { ...u, userRole: membership.role };
    });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageCampaignMembers', {
        action: 'add_member',
        campaign_id: campaign.id,
        target_user_email: newMemberEmail,
        role: newMemberRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewMemberEmail('');
      setNewMemberRole('volunteer');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (email) =>
      base44.functions.invoke('manageCampaignMembers', {
        action: 'remove_member',
        campaign_id: campaign.id,
        target_user_email: email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ email, newRole }) =>
      base44.functions.invoke('manageCampaignMembers', {
        action: 'change_role',
        campaign_id: campaign.id,
        target_user_email: email,
        role: newRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (!canManage) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        Only organisers and admins can manage campaign members.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add member */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Team Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email address"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="organiser">Organiser</SelectItem>
                <SelectItem value="campaign_admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => addMemberMutation.mutate()}
              disabled={!newMemberEmail.trim() || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add'
              )}
            </Button>
          </div>
          {addMemberMutation.isError && (
            <p className="text-sm text-red-600">{addMemberMutation.error?.message}</p>
          )}
          {addMemberMutation.isSuccess && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Member added
            </p>
          )}
        </CardContent>
      </Card>

      {/* Member list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members ({campaignMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {campaignMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={member.userRole}
                    onValueChange={(newRole) =>
                      changeRoleMutation.mutate({ email: member.email, newRole })
                    }
                    disabled={changeRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="organiser">Organiser</SelectItem>
                      <SelectItem value="campaign_admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemberMutation.mutate(member.email)}
                    disabled={removeMemberMutation.isPending}
                  >
                    {removeMemberMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}