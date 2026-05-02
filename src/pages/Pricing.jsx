import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calculator, ArrowRight } from 'lucide-react';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('annual');

  const plans = [
    {
      name: 'Starter',
      description: 'Local campaigns and wards',
      price: billingCycle === 'monthly' ? 99 : 990,
      period: billingCycle,
      contacts: '5,000',
      volunteers: '10',
      color: 'bg-blue-50',
      cta: 'Start Free Trial',
      features: [
        { name: 'Unlimited users per campaign', included: true },
        { name: 'Contact management & geocoding', included: true },
        { name: 'Mobile canvassing app', included: true },
        { name: 'Real-time leaderboards', included: true },
        { name: 'Data import (CSV, Excel)', included: true },
        { name: 'Email alerts', included: true },
        { name: 'Email support', included: true },
        { name: 'Route optimization', included: false },
        { name: 'Slack integration', included: false },
        { name: 'Priority support (24-hour)', included: false },
      ],
    },
    {
      name: 'Professional',
      description: 'Regional & multi-ward campaigns',
      price: billingCycle === 'monthly' ? 299 : 2990,
      period: billingCycle,
      contacts: '50,000',
      volunteers: '100',
      color: 'bg-green-50',
      cta: 'Start Free Trial',
      featured: true,
      features: [
        { name: 'Unlimited users per campaign', included: true },
        { name: 'Contact management & geocoding', included: true },
        { name: 'Mobile canvassing app', included: true },
        { name: 'Real-time leaderboards', included: true },
        { name: 'Data import (CSV, Excel, TMC)', included: true },
        { name: 'Email alerts & Slack integration', included: true },
        { name: 'AI route optimization', included: true },
        { name: 'Turf management & mapping', included: true },
        { name: 'Phone & email support', included: true },
        { name: 'Priority support (24-hour)', included: false },
      ],
    },
    {
      name: 'Enterprise',
      description: 'National campaigns & party infrastructure',
      price: 'Custom',
      period: 'contact sales',
      contacts: 'Unlimited',
      volunteers: 'Unlimited',
      color: 'bg-purple-50',
      cta: 'Contact Sales',
      features: [
        { name: 'All Professional features', included: true },
        { name: 'Unlimited users & campaigns', included: true },
        { name: 'SMS notifications', included: true },
        { name: 'Advanced analytics & reporting', included: true },
        { name: 'White-label platform', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: '24/7 priority support', included: true },
        { name: 'SLA guarantee (99.5% uptime)', included: true },
        { name: 'Onsite training & implementation', included: true },
      ],
    },
  ];

  const addOns = [
    { name: 'Data Migration', price: '£2,000', description: 'Migrate existing voter data from CSV, Excel, or legacy systems' },
    { name: 'Team Training', price: '£500/day', description: 'On-site or remote training for campaign managers & volunteers' },
    { name: 'SMS Notifications', price: '£100/mo', description: 'Send up to 10K SMS alerts for volunteer coordination' },
    { name: 'Advanced Reporting', price: '£50/mo', description: 'Custom dashboards and email reports' },
    { name: 'Implementation Support', price: '£3,000', description: 'Dedicated setup, turf mapping, and go-live support' },
    { name: 'Custom Integrations', price: 'Custom', description: 'Connect to CRM, email providers, or custom systems' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold">Campaign Software Made Simple</h1>
          <p className="text-xl text-muted-foreground">
            One platform for canvassing, coordination, and accountability. No setup fees. Free 30-day trial on all plans. Cancel anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              billingCycle === 'annual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Annual
            <Badge className="ml-2 bg-accent text-accent-foreground">Save 17%</Badge>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.featured ? 'ring-2 ring-primary md:scale-105' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground py-1 text-center text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader className={plan.featured ? 'pt-12' : ''}>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <p className="text-4xl font-bold">
                    {typeof plan.price === 'number' ? `£${plan.price.toLocaleString()}` : plan.price}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {typeof plan.price === 'number' ? `per ${plan.period}` : plan.period}
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    Up to {plan.contacts} contacts · {plan.volunteers} volunteers
                  </p>
                </div>

                {/* CTA */}
                <Button
                  className="w-full"
                  variant={plan.featured ? 'default' : 'outline'}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {/* Features */}
                <div className="space-y-3 pt-6 border-t">
                  {plan.features.map(feature => (
                    <div key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included ? 'text-foreground' : 'text-muted-foreground'
                        }
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ROI Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Campaign ROI Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target voters</label>
                <input
                  type="number"
                  defaultValue={50000}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  onChange={e => console.log(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Avg. doors per volunteer/day</label>
                <input
                  type="number"
                  defaultValue={40}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Canvassing target %</label>
                <input
                  type="number"
                  defaultValue={80}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Platform cost: <span className="font-bold text-foreground">£2,000/month</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Volunteers needed: <span className="font-bold text-foreground">~150</span>
              </p>
              <p className="text-sm text-green-600 font-semibold mt-2">
                ROI: Save ~£5,000 in coordination time vs. spreadsheets
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons */}
        <div className="space-y-4">
          <h2 className="text-2xl font-heading font-bold">Add-ons & Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {addOns.map(addon => (
              <Card key={addon.name}>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                  <p className="text-lg font-bold text-primary">{addon.price}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Add to Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-heading font-bold">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes, change your plan anytime with no fees or penalties. Changes take effect immediately.',
              },
              {
                q: 'Is there a free trial?',
                a: '30-day free trial on all plans. No credit card required to start.',
              },
              {
                q: 'What happens after the election?',
                a: 'Your data is yours to keep. Export contacts, reports, and insights in CSV. We store your data for 12 months at no cost, then delete it unless you ask us to keep it.',
              },
              {
                q: 'Do you offer annual discounts?',
                a: 'Yes — save 17% when you pay annually. Custom discounts available for multi-year campaigns and party infrastructure.',
              },
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}