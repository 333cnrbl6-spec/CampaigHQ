import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useNavigate } from 'react-router-dom';
import { trackEvent, analyticsEvents } from '@/utils/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Plus, LogIn } from 'lucide-react';

export default function CampaignSetup() {
  const { createAndJoinCampaign, joinCampaign } = useCampaign();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form
  const [form, setForm] = useState({
    name: '',
    candidate_name: '',
    party: '',
    constituency: '',
    area: '',
    election_date: '',
  });

  // Join form
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.candidate_name) {
      setError('Campaign name and candidate name are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      trackEvent(analyticsEvents.CAMPAIGN_CREATED, { campaign_name: form.name, party: form.party });
      // Generate a simple invite code
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
      const invite_code = slug + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      await createAndJoinCampaign({ ...form, slug, invite_code });
      navigate('/dashboard');
    } catch (e) {
      setError(e.message || 'Failed to create campaign.');
    }
    setLoading(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinCampaign(inviteCode.trim());
      navigate('/dashboard');
    } catch (e) {
      setError(e.message || 'Failed to join campaign. Check that the invite code is correct.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
         <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
           <MapPin className="w-8 h-8 text-primary-foreground" />
         </div>
         <h1 className="text-2xl font-heading font-bold text-foreground">Welcome to Campaign Hub</h1>
         <p className="text-muted-foreground">
           <strong>Organisers:</strong> Create a new campaign or manage existing ones.
           <br />
           <strong>Volunteers:</strong> Join a campaign with your invite code.
         </p>
        </div>

        <Card>
          <Tabs defaultValue="create">
            <CardHeader className="pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="create" className="flex-1 gap-2">
                  <Plus className="w-4 h-4" /> New Campaign
                </TabsTrigger>
                <TabsTrigger value="join" className="flex-1 gap-2">
                  <LogIn className="w-4 h-4" /> Join Existing
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* CREATE */}
             <TabsContent value="create">
              <form onSubmit={handleCreate}>
                <CardContent className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary/90">
                    📢 You're an organiser? Create your campaign here and invite your team.
                  </div>
                  <div className="space-y-1.5">
                    <Label>Campaign Name *</Label>
                    <Input
                      placeholder="e.g. Tyldesley Green Party 2026"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Candidate Name *</Label>
                      <Input
                        placeholder="e.g. Paul Jones"
                        value={form.candidate_name}
                        onChange={e => setForm({ ...form, candidate_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Party</Label>
                      <Input
                        placeholder="e.g. Green Party"
                        value={form.party}
                        onChange={e => setForm({ ...form, party: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Constituency / Ward</Label>
                      <Input
                        placeholder="e.g. Tyldesley Ward"
                        value={form.constituency}
                        onChange={e => setForm({ ...form, constituency: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Area / Town</Label>
                      <Input
                        placeholder="e.g. Wigan"
                        value={form.area}
                        onChange={e => setForm({ ...form, area: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Election Date</Label>
                    <Input
                      type="date"
                      value={form.election_date}
                      onChange={e => setForm({ ...form, election_date: e.target.value })}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating…' : 'Create Campaign & Continue'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            {/* JOIN */}
             <TabsContent value="join">
              <form onSubmit={handleJoin}>
                <CardContent className="space-y-4">
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent/90">
                    👥 A volunteer? Your organiser will have shared an invite code with you.
                  </div>
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <Users className="w-10 h-10 text-primary" />
                    <p className="text-muted-foreground text-sm">
                      Enter your campaign invite code to join and start helping.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Invite Code</Label>
                    <Input
                      placeholder="e.g. tyldesley-green-2026-AB3X"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading || !inviteCode.trim()}>
                    {loading ? 'Joining…' : 'Join Campaign'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}