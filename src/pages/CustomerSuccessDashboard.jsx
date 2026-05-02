import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, Users, Clock, Mail, Flag } from 'lucide-react';
import { useState } from 'react';

export default function CustomerSuccessDashboard() {
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions', user?.role],
    queryFn: () => user?.role === 'admin' ? base44.asServiceRole.entities.Subscription.list('', 1000) : [],
    enabled: user?.role === 'admin',
  });

  const { data: allCampaigns = [] } = useQuery({
    queryKey: ['all-campaigns', user?.role],
    queryFn: () => user?.role === 'admin' ? base44.asServiceRole.entities.Campaign.list('', 1000) : [],
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
      </div>
    );
  }

  // Categorize customers
  const activeCustomers = allSubscriptions.filter(s => s.status === 'active');
  const trialCustomers = allSubscriptions.filter(s => s.status === 'trial');
  const atRiskCustomers = allSubscriptions.filter(s => 
    (s.status === 'past_due' || s.status === 'expired') || 
    (s.status === 'trial' && new Date(s.trial_end_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
  );

  const topSpenders = activeCustomers.sort((a, b) => b.monthly_price - a.monthly_price).slice(0, 5);

  const customer = selectedCustomer ? allSubscriptions.find(s => s.id === selectedCustomer) : null;
  const campaign = customer ? allCampaigns.find(c => c.id === customer.campaign_id) : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Customer Success</h1>
          <p className="text-muted-foreground">Manage subscriptions, track health, and drive retention</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-3xl font-bold mt-1">{activeCustomers.length}</p>
              <p className="text-xs text-green-600 mt-2">Paying customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Trial Signups</p>
              <p className="text-3xl font-bold mt-1">{trialCustomers.length}</p>
              <p className="text-xs text-blue-600 mt-2">In evaluation</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">At Risk</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">{atRiskCustomers.length}</p>
              <p className="text-xs text-orange-600 mt-2">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg. LTV</p>
              <p className="text-3xl font-bold mt-1">£{activeCustomers.length > 0 ? Math.round(activeCustomers.reduce((sum, s) => sum + s.monthly_price, 0) / activeCustomers.length) : 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Per month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Customers</h2>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setSelectedCustomer(null)}
                className={`px-3 py-2 text-sm font-medium transition ${
                  !selectedCustomer ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                }`}
              >
                Active ({activeCustomers.length})
              </button>
              <button
                className="px-3 py-2 text-sm font-medium text-muted-foreground transition"
              >
                Trials ({trialCustomers.length})
              </button>
              <button
                className="px-3 py-2 text-sm font-medium text-orange-600 transition"
              >
                At Risk ({atRiskCustomers.length})
              </button>
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeCustomers.map(sub => {
                const camp = allCampaigns.find(c => c.id === sub.campaign_id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedCustomer(sub.id)}
                    className={`w-full p-3 rounded-lg border transition text-left ${
                      selectedCustomer === sub.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted border-transparent hover:bg-muted/80'
                    }`}
                  >
                    <p className="font-medium text-sm">{camp?.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.plan}</p>
                    <p className="text-sm font-semibold text-primary mt-1">£{sub.monthly_price}/mo</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Customer Details */}
          <div className="lg:col-span-2 space-y-4">
            {customer && campaign ? (
              <>
                {/* Customer Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{campaign.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.candidate_name} • {campaign.constituency}
                        </p>
                      </div>
                      <Badge variant="default">{customer.plan}</Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Customer Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subscription Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className={`mt-1 ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' :
                          customer.status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Price</p>
                        <p className="text-lg font-semibold mt-1">£{customer.monthly_price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="text-sm font-medium mt-1">{customer.created_date?.split('T')[0]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next Billing</p>
                        <p className="text-sm font-medium mt-1">{customer.next_billing_date || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Mail className="w-4 h-4" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Flag className="w-4 h-4" />
                      Mark as At Risk
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Upsell Opportunity
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Select a customer to view details
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Top Spenders */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topSpenders.map((sub, idx) => {
                const camp = allCampaigns.find(c => c.id === sub.campaign_id);
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-primary w-6">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{camp?.name}</p>
                        <p className="text-xs text-muted-foreground">{sub.plan}</p>
                      </div>
                    </div>
                    <p className="font-semibold">£{sub.monthly_price}/mo</p>
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