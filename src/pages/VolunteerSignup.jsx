import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, Leaf, CheckCircle, ArrowRight } from 'lucide-react';

export default function VolunteerSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('code'); // code, email, confirm
  const [inviteCode, setInviteCode] = useState('');
  const [campaign, setCampaign] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookupCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const matches = await base44.entities.Campaign.filter({
        invite_code: inviteCode.trim(),
      });
      if (matches.length === 0) {
        setError('Campaign code not found. Check with your organiser.');
        setLoading(false);
        return;
      }
      setCampaign(matches[0]);
      setStep('email');
    } catch (e) {
      setError('Failed to find campaign. Please try again.');
    }
    setLoading(false);
  };

  const handleSignupEmail = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Invite the volunteer using the SDK
      await base44.users.inviteUser(email, 'user');
      setStep('confirm');
    } catch (e) {
      setError(e.message || 'Failed to send invite.');
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    navigate('/');
  };

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold">Welcome to {campaign?.name}!</h2>
            <p className="text-muted-foreground">
              An invite link has been sent to <strong>{email}</strong>. Click the link to set up your account and start volunteering.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Check your spam folder if you don't see it in the next minute.
            </p>
            <Button onClick={handleConfirm} className="w-full gap-2 mt-6">
              Back to Home <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Join the Campaign</h1>
          <p className="text-muted-foreground">
            Volunteer to help make a real difference in your community
          </p>
        </div>

        <Card>
          {step === 'code' ? (
            <form onSubmit={handleLookupCode}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Campaign Invite Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your organiser will have given you a campaign invite code. Enter it below to get started.
                </p>
                <div className="space-y-1.5">
                  <Label>Invite Code *</Label>
                  <Input
                    placeholder="e.g. tyldesley-green-2026-AB3X"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !inviteCode.trim()}
                >
                  {loading ? 'Checking…' : 'Continue'}
                </Button>
              </CardContent>
            </form>
          ) : (
            <form onSubmit={handleSignupEmail}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {campaign?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="text-primary/90">
                    <strong>Campaign:</strong> {campaign?.name}
                  </p>
                  {campaign?.candidate_name && (
                    <p className="text-primary/90">
                      <strong>Candidate:</strong> {campaign.candidate_name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Your Email *</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  We'll send you an invite link to complete your signup and join the campaign.
                </p>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep('code');
                      setError('');
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? 'Sending…' : 'Send Invite'}
                  </Button>
                </div>
              </CardContent>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an invite code?{' '}
          <a href="/" className="text-primary hover:underline font-medium">
            Contact your organiser
          </a>
        </p>
      </div>
    </div>
  );
}