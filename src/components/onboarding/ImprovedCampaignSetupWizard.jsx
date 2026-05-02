import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Zap } from 'lucide-react';
import { trackEvent, analyticsEvents } from '@/utils/analytics';

export default function ImprovedCampaignSetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    party: '',
    candidate: '',
    constituency: '',
    electionDate: '',
  });

  const steps = [
    { num: 1, title: 'Campaign Basics', icon: '📋' },
    { num: 2, title: 'Election Info', icon: '🗳️' },
    { num: 3, title: 'Team Setup', icon: '👥' },
    { num: 4, title: 'Ready to Go!', icon: '🚀' },
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      trackEvent(analyticsEvents.CAMPAIGN_SETUP_COMPLETE, {
        campaign_name: formData.name,
        party: formData.party,
      });
      onComplete?.(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4 sm:p-6 flex items-center">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                    step >= s.num
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      step > s.num ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {steps[step - 1].title}
          </p>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[step - 1].icon} {steps[step - 1].title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name</label>
                  <Input
                    placeholder="e.g. Tyldesley Green 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Party</label>
                  <Input
                    placeholder="e.g. Green Party"
                    value={formData.party}
                    onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Candidate Name</label>
                  <Input
                    placeholder="Full name"
                    value={formData.candidate}
                    onChange={(e) => setFormData({ ...formData, candidate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Constituency/Ward</label>
                  <Input
                    placeholder="e.g. Tyldesley"
                    value={formData.constituency}
                    onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Election Date</label>
                  <Input
                    type="date"
                    value={formData.electionDate}
                    onChange={(e) => setFormData({ ...formData, electionDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Quick setup tips:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✓ Invite your team members next</li>
                    <li>✓ Assign them as organizers or volunteers</li>
                    <li>✓ They'll get their own login</li>
                  </ul>
                </div>
                <div>
                  <Button className="w-full" variant="outline">
                    Generate Invite Link
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Share this link with your team to get started
                  </p>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-900">Campaign created!</p>
                  <p className="text-sm text-green-700 mt-2">
                    Your campaign is ready to go. Start by inviting your team and importing voter data.
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <Zap className="w-4 h-4 text-accent" />
                    <span className="font-medium">Next steps</span>
                  </div>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Visit Launch Checklist</li>
                    <li>2. Import your voter contacts</li>
                    <li>3. Set up canvassing turfs</li>
                    <li>4. Invite volunteers & start campaigning</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button className="flex-1 gap-2" onClick={handleNext}>
                {step === steps.length ? 'Get Started' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}