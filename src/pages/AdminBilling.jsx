import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function AdminBilling() {
  const { user } = useAuth();

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions', user?.role],
    queryFn: () => user?.role === 'admin' ? base44.asServiceRole.entities.Subscription.list('', 1000) : [],
    enabled: user?.role === 'admin',
  });

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ['all-campaigns-admin', user?.role],
    queryFn: () => user?.role === 'admin' ? base44.asServiceRole.entities.Campaign.list('', 1000) : [],
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">Only admins can view billing analytics.</p>
      </div>
    );
  }

  // Calculate metrics
  const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active').length;
  const trialSubscriptions = allSubscriptions.filter(s => s.status === 'trial').length;
  const expiredTrials = allSubscriptions.filter(s => s.status === 'expired').length;

  const monthlyRecurringRevenue = allSubscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const prices = { starter: 99, professional: 299, enterprise: 0 };
      return sum + (prices[s.plan] || 0);
    }, 0);

  const subscriptionsByPlan = {
    starter: allSubscriptions.filter(s => s.plan === 'starter' && s.status === 'active').length,
    professional: allSubscriptions.filter(s => s.plan === 'professional' && s.status === 'active').length,
    enterprise: allSubscriptions.filter(s => s.plan === 'enterprise' && s.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Billing Analytics</h1>
          <p className="text-muted-foreground">Revenue, subscriptions, and customer metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monthly Revenue
                </p>
                <p className="text-3xl font-bold">£{monthlyRecurringRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{activeSubscriptions} active subscriptions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Paid Plans
                </p>
                <p className="text-3xl font-bold">{activeSubscriptions}</p>
                <p className="text-xs text-muted-foreground">Active paid subscriptions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Trials
                </p>
                <p className="text-3xl font-bold">{trialSubscriptions}</p>
                <p className="text-xs text-muted-foreground">Active trial users</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Expired Trials</p>
                <p className="text-3xl font-bold">{expiredTrials}</p>
                <p className="text-xs text-muted-foreground">Need to convert or churn</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { plan: 'Starter', count: subscriptionsByPlan.starter, price: '£99/mo' },
                { plan: 'Professional', count: subscriptionsByPlan.professional, price: '£299/mo' },
                { plan: 'Enterprise', count: subscriptionsByPlan.enterprise, price: 'Custom' },
              ].map(item => (
                <div key={item.plan} className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-semibold">{item.plan}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{item.price}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allSubscriptions
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .slice(0, 10)
                .map(sub => {
                  const campaign = allCampaigns.find(c => c.id === sub.campaign_id);
                  const statusColor = {
                    active: 'bg-green-100 text-green-800',
                    trial: 'bg-blue-100 text-blue-800',
                    expired: 'bg-gray-100 text-gray-800',
                    past_due: 'bg-yellow-100 text-yellow-800',
                  };

                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{campaign?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign?.candidate_name} • {campaign?.constituency}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold capitalize">{sub.plan}</p>
                          {sub.status === 'trial' && sub.trial_end_date && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {sub.trial_end_date}
                            </p>
                          )}
                        </div>
                        <Badge className={statusColor[sub.status]}>
                          {sub.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Churn Risk */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle>⚠️ Churn Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allSubscriptions
                .filter(s => s.status === 'expired')
                .slice(0, 5)
                .map(sub => {
                  const campaign = allCampaigns.find(c => c.id === sub.campaign_id);
                  return (
                    <div key={sub.id} className="p-3 bg-white rounded border-l-4 border-orange-400">
                      <p className="font-medium text-sm">{campaign?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Trial expired {sub.trial_end_date} - needs conversion outreach
                      </p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}