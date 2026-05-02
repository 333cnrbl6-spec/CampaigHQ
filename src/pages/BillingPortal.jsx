import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { trackEvent, analyticsEvents } from '@/utils/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Download, Settings, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function BillingPortal() {
  const { campaign } = useCampaign();
  const [loading, setLoading] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', campaign?.id],
    queryFn: () => campaign?.id ? base44.entities.Subscription.filter({ campaign_id: campaign.id }, '', 1).then(r => r[0]) : null,
    enabled: !!campaign?.id,
  });

  const { data: usage } = useQuery({
    queryKey: ['usage-metrics', campaign?.id],
    queryFn: () => campaign?.id ? base44.entities.UsageMetrics.filter({ campaign_id: campaign.id }, '', 1).then(r => r[0]) : null,
    enabled: !!campaign?.id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-count', campaign?.id],
    queryFn: () => campaign?.id ? base44.entities.Contact.filter({ campaign_id: campaign.id }, '', 100000) : [],
    enabled: !!campaign?.id,
  });

  const handleUpgrade = async (plan) => {
    setLoading(true);
    try {
      trackEvent(analyticsEvents.CHECKOUT_STARTED, { plan });
      const response = await base44.functions.invoke('createCheckoutSession', {
        campaign_id: campaign.id,
        plan,
      });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      alert('Error starting checkout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const planDetails = {
    starter: { name: 'Starter', price: '£99', contacts: 1000, volunteers: 10 },
    professional: { name: 'Professional', price: '£299', contacts: 10000, volunteers: 100 },
    enterprise: { name: 'Enterprise', price: 'Custom', contacts: 1000000, volunteers: 1000 },
  };

  const statusBadge = {
    trial: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
    active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    past_due: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
    canceled: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
  };

  const currentStatus = statusBadge[subscription?.status] || statusBadge.trial;
  const StatusIcon = currentStatus.icon;

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
        <p className="text-muted-foreground">Select a campaign to view billing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">{campaign.name}</p>
        </div>

        {/* Current Status */}
        {subscription && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Plan</CardTitle>
                <Badge className={`${currentStatus.bg} ${currentStatus.text}`}>
                  <StatusIcon className="w-3 h-3 mr-1 inline" />
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plan Info */}
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold">{planDetails[subscription.plan].name}</p>
                  <p className="text-lg font-semibold text-primary mt-1">{planDetails[subscription.plan].price}/month</p>
                </div>

                {/* Trial Status */}
                {subscription.status === 'trial' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trial Ends</p>
                    <p className="text-lg font-semibold">{subscription.trial_end_date}</p>
                    <p className="text-sm text-amber-600 mt-1">
                      {Math.ceil((new Date(subscription.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                    </p>
                  </div>
                )}

                {/* Billing Cycle */}
                {subscription.status === 'active' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Next Billing Date</p>
                    <p className="text-lg font-semibold">{subscription.next_billing_date}</p>
                    <p className="text-sm text-muted-foreground mt-1">Auto-renews monthly</p>
                  </div>
                )}

                {/* Limits */}
                <div>
                  <p className="text-sm text-muted-foreground">Limits</p>
                  <p className="text-sm font-medium mt-1">
                    {planDetails[subscription.plan].contacts.toLocaleString()} contacts
                  </p>
                  <p className="text-sm font-medium">
                    {planDetails[subscription.plan].volunteers} volunteers
                  </p>
                </div>
              </div>

              {subscription.status === 'trial' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Your trial ends on {subscription.trial_end_date}. Choose a plan to continue using the platform.
                  </p>
                </div>
              )}

              {subscription.status === 'past_due' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900 font-semibold">
                    ⚠️ Payment overdue. Please update your payment method to restore service.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Usage */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Current Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contacts */}
                <div>
                  <p className="text-sm text-muted-foreground">Contacts</p>
                  <p className="text-3xl font-bold">{contacts.length.toLocaleString()}</p>
                  <div className="mt-2 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(100, (contacts.length / planDetails[subscription?.plan].contacts) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {planDetails[subscription?.plan].contacts.toLocaleString()} allowed
                  </p>
                </div>

                {/* Canvassing Sessions */}
                <div>
                  <p className="text-sm text-muted-foreground">Canvassing Sessions</p>
                  <p className="text-3xl font-bold">{usage.canvassing_sessions}</p>
                  <p className="text-xs text-muted-foreground mt-3">This billing period</p>
                </div>

                {/* Storage */}
                <div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                  <p className="text-3xl font-bold">{(usage.storage_used_mb / 1024).toFixed(1)} GB</p>
                  <p className="text-xs text-muted-foreground mt-3">Included: 50 GB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Options */}
        {subscription?.status === 'trial' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['starter', 'professional', 'enterprise'].map(plan => (
                <Card key={plan} className={subscription.plan === plan ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <CardTitle>{planDetails[plan].name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-3xl font-bold">{planDetails[plan].price}</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {planDetails[plan].contacts.toLocaleString()} contacts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {planDetails[plan].volunteers} volunteers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        All features included
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      disabled={loading}
                      onClick={() => handleUpgrade(plan)}
                    >
                      {loading ? 'Processing...' : 'Start with ' + planDetails[plan].name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Payment Method */}
        {subscription && subscription.status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Visa ending in</p>
                  <p className="text-lg font-semibold">{subscription.payment_method || '****'}</p>
                </div>
                <Button variant="outline">Update Payment</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices yet. Invoices will appear after your first payment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}