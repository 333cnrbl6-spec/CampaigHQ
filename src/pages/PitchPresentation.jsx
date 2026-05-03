import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, MapPin, TrendingUp, Shield, Zap, DollarSign, FileText } from 'lucide-react';
import OwnerOnly from '@/components/auth/OwnerOnly';

function PitchPresentationInner() {
  const [selectedPlan, setSelectedPlan] = useState('scale');

  const pricingPlans = [
    {
      id: 'local',
      name: 'Local Campaign',
      price: '£2,999',
      period: '/month',
      setup: '£1,500 one-time',
      volunteers: 'up to 50',
      contacts: '50,000 contacts',
      users: '5 admin users',
      description: 'Perfect for local council elections',
      features: [
        'Volunteer management',
        'Contact database',
        'Basic analytics',
        'Turf management',
        'Email & Slack alerts',
        'Mobile app',
        '7-day support',
      ],
    },
    {
      id: 'scale',
      name: 'Regional Scale',
      price: '£7,999',
      period: '/month',
      setup: '£3,000 one-time',
      volunteers: 'up to 500',
      contacts: '500,000 contacts',
      users: '20 admin users',
      description: 'For regional or parliamentary campaigns',
      features: [
        'Everything in Local',
        'Advanced routing',
        'Live location tracking',
        'Leaflet management',
        'Outreach sequences',
        'Advanced reporting',
        'SMS alerts',
        '24/7 support',
        'Custom integrations',
      ],
      featured: true,
    },
    {
      id: 'national',
      name: 'National',
      price: 'Custom',
      period: 'Contact sales',
      setup: 'Custom',
      volunteers: 'Unlimited',
      contacts: 'Unlimited',
      users: 'Unlimited',
      description: 'Multi-campaign coordination platform',
      features: [
        'Everything in Regional',
        'Multi-campaign management',
        'National dashboard',
        'Advanced AI routing',
        'GDPR compliance suite',
        'Data integration services',
        'Dedicated account manager',
        'SLA guarantee (99.5% uptime)',
        'Custom branding',
        'White-label options',
      ],
    },
  ];

  const competitors = [
    {
      name: 'Campaign Manager',
      our_feature: '✓',
      pricing: '£2-8k/mo',
      mobile: 'Yes',
      realtime: 'Yes',
      gdpr: 'Full',
      support: '24/7',
      us: true,
    },
    {
      name: 'NationBuilder',
      our_feature: '✗',
      pricing: '$300+/mo',
      mobile: 'Limited',
      realtime: 'No',
      gdpr: 'Partial',
      support: 'Email',
      us: false,
    },
    {
      name: 'Ngp VAN',
      our_feature: '✗',
      pricing: '$1k+/mo',
      mobile: 'Basic',
      realtime: 'Limited',
      gdpr: 'Complex',
      support: 'Business hours',
      us: false,
    },
    {
      name: 'Snappy',
      our_feature: '✗',
      pricing: '£500/mo',
      mobile: 'Yes',
      realtime: 'No',
      gdpr: 'Basic',
      support: 'Email',
      us: false,
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: 'Volunteer Coordination',
      description: 'Manage 1000+ volunteers with real-time task assignment, shift scheduling, and performance tracking.',
    },
    {
      icon: MapPin,
      title: 'Territory Management',
      description: 'Draw geographic turfs, assign volunteers, optimize routes, and track coverage in real-time.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Live dashboards, leaderboards, support level analysis, and contact distribution tracking.',
    },
    {
      icon: TrendingUp,
      title: 'Canvassing Scale',
      description: 'Tested to 1000+ concurrent volunteers. Log interactions, track responses, measure impact.',
    },
    {
      icon: Shield,
      title: 'GDPR Compliant',
      description: 'Full compliance built-in. Consent tracking, audit logs, right to deletion, data protection.',
    },
    {
      icon: Zap,
      title: 'Mobile-First',
      description: 'Works offline. iOS/Android ready. PWA for easy deployment. Field volunteers never disconnect.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero */}
      <section className="p-8 md:p-16 bg-sidebar text-sidebar-foreground">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold">Campaign Manager</h1>
          <p className="text-xl text-sidebar-foreground/80">
            Enterprise-grade campaign management platform built for UK political campaigns.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-sidebar-primary hover:bg-sidebar-primary/90">
              Download Pitch Deck (PDF)
            </Button>
            <Button size="lg" variant="outline">
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="p-8 md:p-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-heading font-bold mb-8 text-center">Why Campaign Manager?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <p className="text-muted-foreground">Concurrent volunteers tested</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-3xl font-bold text-primary">£0.01</div>
                <p className="text-muted-foreground">Cost per contact managed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <div className="text-3xl font-bold text-primary">40%</div>
                <p className="text-muted-foreground">Time saved vs manual tracking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="p-8 md:p-16 bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-heading font-bold mb-8 text-center">Platform Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx}>
                  <CardContent className="p-6 space-y-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="p-8 md:p-16">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-heading font-bold mb-2">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Choose the plan that fits your campaign scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <Card key={plan.id} className={plan.featured ? 'border-primary border-2' : ''}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-3xl font-bold">{plan.price}</div>
                    <p className="text-xs text-muted-foreground">{plan.period}</p>
                    <p className="text-xs text-muted-foreground mt-1">Setup: {plan.setup}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><strong>Volunteers:</strong> {plan.volunteers}</p>
                    <p><strong>Contacts:</strong> {plan.contacts}</p>
                    <p><strong>Admin users:</strong> {plan.users}</p>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.featured ? 'default' : 'outline'}
                  >
                    {plan.id === 'national' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-6 bg-accent/10 rounded-lg space-y-3">
            <h3 className="font-semibold">Volume & Annual Discounts Available</h3>
            <p className="text-sm text-muted-foreground">
              • 10% discount for annual prepayment<br />
              • 15% discount for 2+ campaigns<br />
              • Custom pricing for national tier
            </p>
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="p-8 md:p-16 bg-secondary/50">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-heading font-bold mb-2">How We Compare</h2>
            <p className="text-muted-foreground">Feature comparison with leading competitors.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  {competitors.map((comp) => (
                    <th
                      key={comp.name}
                      className={`text-center p-3 font-semibold ${
                        comp.us ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Pricing</td>
                  {competitors.map((comp) => (
                    <td key={comp.name} className={`text-center p-3 ${comp.us ? 'bg-primary/5' : ''}`}>
                      {comp.pricing}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3">Mobile App</td>
                  {competitors.map((comp) => (
                    <td key={comp.name} className={`text-center p-3 ${comp.us ? 'bg-primary/5' : ''}`}>
                      {comp.mobile}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3">Real-Time Tracking</td>
                  {competitors.map((comp) => (
                    <td key={comp.name} className={`text-center p-3 ${comp.us ? 'bg-primary/5' : ''}`}>
                      {comp.realtime}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3">GDPR Compliance</td>
                  {competitors.map((comp) => (
                    <td key={comp.name} className={`text-center p-3 ${comp.us ? 'bg-primary/5' : ''}`}>
                      {comp.gdpr}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3">Support</td>
                  {competitors.map((comp) => (
                    <td key={comp.name} className={`text-center p-3 ${comp.us ? 'bg-primary/5' : ''}`}>
                      {comp.support}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Data Ownership */}
      <section className="p-8 md:p-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-heading font-bold text-center">Data Ownership & Security</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What You Own</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>✓ All voter contact data</p>
                <p>✓ Campaign materials & content</p>
                <p>✓ Volunteer records & history</p>
                <p>✓ Interaction logs & responses</p>
                <p>✓ Reports & analysis outputs</p>
                <p>✓ Full data export rights</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What We Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>✓ Infrastructure & servers</p>
                <p>✓ Security & encryption</p>
                <p>✓ Backups & disaster recovery</p>
                <p>✓ Updates & maintenance</p>
                <p>✓ GDPR compliance monitoring</p>
                <p>✓ Technical support (24/7)</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>✓ GDPR compliant (UK DPA 2018)</p>
              <p>✓ End-to-end encryption</p>
              <p>✓ Daily automatic backups</p>
              <p>✓ SOC 2 ready security audit</p>
              <p>✓ 99.5% uptime SLA</p>
              <p>✓ Full audit trail logging</p>
              <p>✓ Data retention policies built-in</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="p-8 md:p-16 bg-sidebar text-sidebar-foreground">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-heading font-bold">Ready to Transform Your Campaign?</h2>
          <p className="text-lg text-sidebar-foreground/80">
            Start with a demo campaign today. Load sample data in seconds.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-sidebar-primary hover:bg-sidebar-primary/90">
              <FileText className="w-4 h-4 mr-2" />
              Download Full Pitch Deck (PDF)
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo Call
            </Button>
          </div>
          <p className="text-sm text-sidebar-foreground/60">
            Questions? Email: hello@campaignhq.co.uk
          </p>
        </div>
      </section>
    </div>
  );
}

export default function PitchPresentation() {
  return <OwnerOnly><PitchPresentationInner /></OwnerOnly>;
}