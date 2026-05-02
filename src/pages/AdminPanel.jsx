import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, Building2, Mail, Trash2, Plus, Edit2, Shield } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [campaignForm, setCampaignForm] = useState({
    name: '', candidate_name: '', party: '', constituency: '', status: 'active'
  });

  // Fetch all campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['all-campaigns-admin'],
    queryFn: () => base44.entities.Campaign.list('name', 5000),
  });

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['all-users-admin'],
    queryFn: () => base44.entities.User.list('email', 5000),
  });

  // Campaign mutations
  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-campaigns-admin'] });
      setShowDialog(false);
      setEditingCampaign(null);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-campaigns-admin'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ email, role }) => base44.auth.updateMe({ email, role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users-admin'] }),
  });

  // Only admins
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">Only admins can access the admin panel.</p>
      </div>
    );
  }

  const handleOpenEdit = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      candidate_name: campaign.candidate_name,
      party: campaign.party,
      constituency: campaign.constituency,
      status: campaign.status,
    });
    setShowDialog(true);
  };

  const handleSaveCampaign = async () => {
    if (!campaignForm.name) return;
    updateCampaignMutation.mutate({
      id: editingCampaign.id,
      data: campaignForm,
    });
  };

  const filteredUsers = allUsers.filter(u =>
    u.email?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">Manage campaigns, users, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'campaigns'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users ({allUsers.length})
          </button>
        </div>

        {/* CAMPAIGNS TAB */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {campaignsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map(campaign => (
                  <Card key={campaign.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {campaign.candidate_name} • {campaign.constituency}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Owner: {campaign.owner_email}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(campaign)}
                          >
                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete ${campaign.name}?`)) {
                                deleteCampaignMutation.mutate(campaign.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                className="pl-10"
              />
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-muted-foreground">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{u.full_name || '—'}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={u.role || 'user'}
                            onValueChange={(newRole) =>
                              updateUserMutation.mutate({ email: u.email, role: newRole })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="ghost" disabled>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Edit Campaign Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={campaignForm.name}
                  onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Candidate Name</Label>
                <Input
                  value={campaignForm.candidate_name}
                  onChange={e => setCampaignForm({ ...campaignForm, candidate_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Party</Label>
                  <Input
                    value={campaignForm.party}
                    onChange={e => setCampaignForm({ ...campaignForm, party: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Constituency</Label>
                  <Input
                    value={campaignForm.constituency}
                    onChange={e => setCampaignForm({ ...campaignForm, constituency: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={campaignForm.status}
                  onValueChange={status => setCampaignForm({ ...campaignForm, status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={handleSaveCampaign}
                disabled={updateCampaignMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}