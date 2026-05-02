import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Save, Flag } from 'lucide-react';
import { toast } from 'sonner';
import CampaignMembersPanel from '@/components/campaign/CampaignMembersPanel';

export default function CampaignSettings() {
  const { campaign, loadCampaign, userRole } = useCampaign();
  const { user } = useAuth();
  const [form, setForm] = useState(campaign || {});
  const [saving, setSaving] = useState(false);

  const isOwner = user?.email === campaign?.owner_email || user?.role === 'admin';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Campaign.update(campaign.id, form);
    await loadCampaign();
    toast.success('Campaign settings saved.');
    setSaving(false);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(campaign.invite_code || '');
    toast.success('Invite code copied!');
  };

  if (!campaign) {
    return (
      <div className="p-8 text-center text-muted-foreground">No active campaign.</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Flag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-heading font-bold">Campaign Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your campaign details</p>
        </div>
      </div>

      {/* Invite code */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Invite Code</CardTitle>
          <CardDescription>Share this with volunteers so they can join your campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
              {campaign.invite_code || 'Not set'}
            </code>
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaign Details</CardTitle>
          {!isOwner && <CardDescription>Only the campaign owner can edit these settings.</CardDescription>}
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                disabled={!isOwner}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Candidate Name</Label>
                <Input
                  value={form.candidate_name || ''}
                  onChange={e => setForm({ ...form, candidate_name: e.target.value })}
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Party</Label>
                <Input
                  value={form.party || ''}
                  onChange={e => setForm({ ...form, party: e.target.value })}
                  disabled={!isOwner}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Constituency / Ward</Label>
                <Input
                  value={form.constituency || ''}
                  onChange={e => setForm({ ...form, constituency: e.target.value })}
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Area / Town</Label>
                <Input
                  value={form.area || ''}
                  onChange={e => setForm({ ...form, area: e.target.value })}
                  disabled={!isOwner}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Election Date</Label>
              <Input
                type="date"
                value={form.election_date || ''}
                onChange={e => setForm({ ...form, election_date: e.target.value })}
                disabled={!isOwner}
              />
            </div>
            {isOwner && (
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            )}
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaign Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
            {campaign.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Created by {campaign.owner_email}
          </span>
        </CardContent>
      </Card>

      {/* Team members management */}
      <CampaignMembersPanel />
    </div>
  );
}