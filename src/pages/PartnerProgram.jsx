import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Award, Zap, ArrowRight, HandshakeIcon } from 'lucide-react';

export default function PartnerProgram() {
  const tiers = [
    {
      name: 'Registered Partner',
      description: 'Get started with early access and community benefits',
      benefits: [
        'Early access to new features',
        'Dedicated Slack channel for partners',
        'Monthly newsletter with market insights',
        'Co-marketing opportunities',
      ],
      commission: '0%',
      focus: 'Community & Learning',
    },
    {
      name: 'Reseller Partner',
      description: 'Sell on behalf of our platform',
      benefits: [
        'All Registered Partner benefits',
        '15% recurring commission on MRR',
        'White-label capabilities',
        'Co-branded campaigns & materials',
        'Quarterly business reviews',
      ],
      commission: '15%',
      focus: 'Revenue Sharing',
      featured: true,
    },
    {
      name: 'Strategic Partner',
      description: 'Deep integration and co-development',
      benefits: [
        'All Reseller Partner benefits',
        '20% recurring commission',
        'Custom feature development',
        'Revenue sharing on integrations',
        'Dedicated account manager',
        'Joint go-to-market strategy',
      ],
      commission: '20%',
      focus: 'Growth Partnership',
    },
  ];

  const partnerTypes = [
    {
      icon: Users,
      title: 'Political Consultancies',
      description: 'Offer end-to-end campaign management services powered by our platform',
      examples: ['Strategic Comms', 'Campaign Planning', 'Volunteer Training'],
    },
    {
      icon: TrendingUp,
      title: 'Data & Analytics Firms',
      description: 'Integrate voter data, predictive modeling, and advanced analytics',
      examples: ['Voter Enrichment', 'Predictive Analytics', 'Polling Integration'],
    },
    {
      icon: Award,
      title: 'Training & Education',
      description: 'Offer certified campaign management training using our platform',
      examples: ['University Partnerships', 'Professional Development', 'Certification Programs'],
    },
    {
      icon: Zap,
      title: 'Tech Integration Partners',
      description: 'Build integrations with payment, CRM, or communication systems',
      examples: ['SMS/Email APIs', 'CRM Connectors', 'Payment Processing'],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold">Partner with Us</h1>
          <p className="text-xl text-muted-foreground">
            Build your business on top of the leading campaign platform
          </p>
        </div>

        {/* Partner Tiers */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Partnership Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map(tier => (
              <Card
                key={tier.name}
                className={`relative overflow-hidden transition-all ${
                  tier.featured ? 'ring-2 ring-primary md:scale-105' : ''
                }`}
              >
                {tier.featured && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground py-1 text-center text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader className={tier.featured ? 'pt-12' : ''}>
                  <CardTitle>{tier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-3xl font-bold">{tier.commission}</p>
                    <p className="text-sm text-muted-foreground">Commission rate</p>
                  </div>

                  <ul className="space-y-2">
                    {tier.benefits.map(benefit => (
                      <li key={benefit} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full" variant={tier.featured ? 'default' : 'outline'}>
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Partner Types */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Types of Partners We Work With</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerTypes.map((type, i) => {
              const Icon = type.icon;
              return (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-primary" />
                      <h3 className="font-semibold text-lg">{type.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {type.examples.map(example => (
                        <Badge key={example} variant="secondary">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Partner Success Metrics */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Average Partner Success Metrics (Annual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg. Clients Added</p>
                <p className="text-3xl font-bold">8-12</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg. MRR Generated</p>
                <p className="text-3xl font-bold">£15K-25K</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg. Annual Commission</p>
                <p className="text-3xl font-bold">£27K-60K</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Time to First Sale</p>
                <p className="text-3xl font-bold">2-4 weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: '1',
                title: 'Apply',
                description: 'Submit your partner application with your business details',
              },
              {
                step: '2',
                title: 'Onboard',
                description: 'Join our partner program with dedicated support & materials',
              },
              {
                step: '3',
                title: 'Sell',
                description: 'Recruit clients and earn 15-20% recurring commission',
              },
              {
                step: '4',
                title: 'Scale',
                description: 'Get promoted to higher tier for bigger discounts & features',
              },
            ].map(item => (
              <div key={item.step} className="relative">
                <Card>
                  <CardContent className="pt-6 space-y-3 text-center">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">
                      {item.step}
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
                {item.step !== '4' && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 transform">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Partner Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Sales Playbook',
                description: 'Complete guide to selling the platform with templates and scripts',
              },
              {
                title: 'API Documentation',
                description: 'Build custom integrations with our comprehensive API docs',
              },
              {
                title: 'Marketing Toolkit',
                description: 'Co-branded materials, case studies, and campaign templates',
              },
              {
                title: 'Training Program',
                description: 'Become certified to train your clients on the platform',
              },
              {
                title: 'Demo Environment',
                description: 'Dedicated sandbox for testing and customer demonstrations',
              },
              {
                title: 'Partner Community',
                description: 'Connect with other partners, share best practices, and network',
              },
            ].map((resource, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-8 text-center space-y-4">
            <HandshakeIcon className="w-12 h-12 mx-auto opacity-80" />
            <h3 className="text-2xl font-heading font-bold">Ready to partner with us?</h3>
            <p className="text-primary-foreground/90">
              Start building your business with us. Apply to the program today.
            </p>
            <Button variant="secondary" size="lg">
              Apply to Partner Program
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}