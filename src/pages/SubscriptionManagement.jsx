import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

export default function SubscriptionManagement() {
  const { campaign } = useCampaign();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', campaign?.id],
    queryFn: () => campaign?.id ? base44.entities.Subscription.filter({ campaign_id: campaign.id }, '', 1).then(r => r[0]) : null,
    enabled: !!campaign?.id,
  });

  const changePlanMutation = useMutation({
    mutationFn: (newPlan) => base44.functions.invoke('manageSubscriptionChange', {
      subscription_id: subscription.id,
      new_plan: newPlan,
      action: 'change',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', campaign?.id] });
      setSelectedPlan(null);
      alert('Plan updated successfully!');
    },
    onError: (error) => {
      alert('Error updating plan: ' + error.message);
    },
  });

  const plans = [
    { id: 'starter', name: 'Starter', price: 99, contacts: 1000, volunteers: 10 },
    { id: 'professional', name: 'Professional', price: 299, contacts: 10000, volunteers: 100 },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', contacts: '1M+', volunteers: '1000+' },
  ];

  if (!campaign || !subscription) {
    return <div className="p-8 text-center"><p className="text-muted-foreground">Loading subscription...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Manage Your Subscription</h1>
          <p className="text-muted-foreground">{campaign.name}</p>
        </div>

        {/* Current Plan Highlight */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold capitalize mt-1">{subscription.plan}</p>
                <p className="text-lg font-semibold text-primary mt-2">£{subscription.monthly_price}/month</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Next Billing</p>
                <p className="text-lg font-semibold mt-1">{subscription.next_billing_date}</p>
                <p className="text-xs text-muted-foreground mt-2">Auto-renews monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const isCurrent = subscription.plan === plan.id;
              return (
                <Card key={plan.id} className={isCurrent ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {isCurrent && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-3xl font-bold">{typeof plan.price === 'number' ? `£${plan.price}` : plan.price}</p>
                    <ul className="space-y-2 text-sm">
                      <li>• {typeof plan.contacts === 'number' ? plan.contacts.toLocaleString() : plan.contacts} contacts</li>
                      <li>• {plan.volunteers} volunteers</li>
                      <li>• All features included</li>
                    </ul>

                    {isCurrent ? (
                      <Button variant="outline" disabled className="w-full">Current Plan</Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          changePlanMutation.mutate(plan.id);
                        }}
                        disabled={changePlanMutation.isPending}
                      >
                        {changePlanMutation.isPending && selectedPlan === plan.id
                          ? 'Updating...'
                          : subscription.monthly_price > plan.price
                          ? `Downgrade • Save £${subscription.monthly_price - plan.price}`
                          : `Upgrade • Pay £${plan.price - subscription.monthly_price} more`
                        }
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Proration Info */}
        {subscription.status === 'active' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                Prorated Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-900">
              <p>Plan changes are prorated to your billing cycle. You'll only pay for the difference.</p>
            </CardContent>
          </Card>
        )}

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: subscription.billing_cycle_start, amount: subscription.monthly_price, status: 'Paid' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">{subscription.plan} Plan</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">£{item.amount}</p>
                    <p className="text-xs text-green-600">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}