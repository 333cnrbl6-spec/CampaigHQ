import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Code, FileText, CheckCircle, ArrowRight } from 'lucide-react';

export default function Services() {
  const services = [
    {
      name: 'Data Migration & Import',
      price: '£2,000',
      icon: FileText,
      description: 'Migrate voter data from electoral registers, legacy systems, or spreadsheets with full validation and deduplication',
      includes: [
        'Full data assessment and format analysis',
        'Deduplication, cleaning, and validation',
        'Automatic postcode extraction and geocoding',
        'Turf zone tagging and assignment',
        'Post-import verification and audit',
      ],
      timeline: '1-2 weeks',
      deliverables: [
        'Fully imported, deduplicated contact database',
        'Data quality report with validation summary',
        'Import log for audit and rollback capability',
      ],
    },
    {
      name: 'Campaign Training Program',
      price: '£500/day',
      icon: Users,
      description: 'Comprehensive training for campaign managers, volunteers, and field teams',
      includes: [
        'Executive strategy session (2 hours)',
        'Campaign manager & organizer training (6 hours)',
        'Volunteer field training & mobile app demo (4 hours)',
        'Custom workflows & localized documentation',
        '2 weeks post-training support',
      ],
      timeline: '2-3 days on-site or remote',
      deliverables: [
        'Complete training materials & slide decks',
        'Custom user guides by role',
        'Video tutorials for self-serve learning',
        'Quick reference cards for field teams',
      ],
    },
    {
      name: 'Custom Integrations & API',
      price: 'Custom quote',
      icon: Code,
      description: 'Integrate with CRM, email platforms, analytics tools, or build custom workflows via API',
      includes: [
        'Requirements analysis and design',
        'Custom API development and webhooks',
        'Real-time data sync setup',
        'Testing, validation, and QA',
        '30 days post-launch support & monitoring',
      ],
      timeline: '2-8 weeks depending on scope',
      deliverables: [
        'Complete integration documentation',
        'API implementation guide & examples',
        'Test coverage reports',
        'Monitoring & alerting setup',
      ],
    },
    {
      name: 'White-Label Deployment',
      price: '£5,000',
      icon: FileText,
      description: 'Custom branding, domain, and deployment for parties or organizations',
      includes: [
        'Full logo, color, and branding customization',
        'Custom domain setup with SSL',
        'Email configuration and DKIM setup',
        'Branded login, landing, and help pages',
        'Custom branding in all user-facing areas',
      ],
      timeline: '1-2 weeks',
      deliverables: [
        'Fully branded production instance',
        'Custom domain with SSL certificate',
        'Branded mobile-responsive interface',
        'Brand guidelines & asset documentation',
      ],
    },
  ];

  const premiumSupport = [
    {
      tier: 'Standard',
      price: 'Included',
      response: '24 hours',
      availability: 'Business hours (9am-5pm GMT)',
      features: [
        'Email & in-app chat support',
        'Help center & documentation access',
        'Community forum for campaigns',
        'Bi-weekly check-ins',
      ],
    },
    {
      tier: 'Priority',
      price: '£200/month',
      response: '4 hours',
      availability: '9am-6pm GMT, Mon-Fri',
      features: [
        'All Standard features',
        'Phone & email priority support',
        'Dedicated technical contact',
        'Weekly check-ins & performance reviews',
        'Quarterly strategic review calls',
      ],
    },
    {
      tier: 'Premium (Election Day)',
      price: '£500/month',
      response: '1 hour',
      availability: '24/7 during election period',
      features: [
        'All Priority features',
        '24/7 support (election week + 3 days)',
        'War room access with dedicated team',
        'Daily performance reports & briefings',
        'Emergency direct hotline',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold">Professional Services & Support</h1>
          <p className="text-xl text-muted-foreground">
            Expert implementation, training, custom integrations, and dedicated support for successful campaigns
          </p>
        </div>

        {/* Core Services */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Implementation Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map(service => {
              const Icon = service.icon;
              return (
                <Card key={service.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-8 h-8 text-primary" />
                      <Badge variant="secondary">{service.timeline}</Badge>
                    </div>
                    <CardTitle>{service.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div>
                      <p className="text-3xl font-bold">{service.price}</p>
                    </div>

                    {/* Includes */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">What's Included:</h4>
                      <ul className="space-y-2">
                        {service.includes.map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Deliverables */}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Deliverables:</h4>
                      <ul className="space-y-1">
                        {service.deliverables.map(item => (
                          <li key={item} className="text-xs text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button className="w-full">
                      Request Quote <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support Tiers */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Premium Support Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumSupport.map(support => (
              <Card key={support.tier}>
                <CardHeader>
                  <CardTitle className="text-xl">{support.tier}</CardTitle>
                  <p className="text-2xl font-bold mt-2">{support.price}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Response Time */}
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Response Time</p>
                    <p className="text-lg font-bold">{support.response}</p>
                  </div>

                  {/* Availability */}
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Available</p>
                    <p className="text-lg font-bold">{support.availability}</p>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Includes:</h4>
                    <ul className="space-y-2">
                      {support.features.map(feature => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full" variant={support.tier === 'Priority' ? 'default' : 'outline'}>
                    Add to Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Implementation Timeline */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Typical Implementation Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { phase: 'Week 1', title: 'Setup', tasks: 'Data import, user creation, initial training' },
                { phase: 'Week 2-3', title: 'Customization', tasks: 'Branding, integrations, workflows' },
                { phase: 'Week 4', title: 'Testing', tasks: 'QA, user acceptance testing' },
                { phase: 'Week 5+', title: 'Go Live', tasks: 'Launch support & optimization' },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="font-semibold text-primary">{item.phase}</p>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.tasks}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Success Stories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Why Organizations Trust Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                stat: '98%',
                label: 'Project completion rate',
              },
              {
                stat: '2.1 weeks',
                label: 'Average time to full deployment',
              },
              {
                stat: '4.9★',
                label: 'Average client satisfaction',
              },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-6 space-y-2">
                  <p className="text-4xl font-bold text-primary">{item.stat}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-8 text-center space-y-4">
            <h3 className="text-2xl font-heading font-bold">Ready to get started?</h3>
            <p className="text-primary-foreground/90">
              Let's discuss which services are right for your campaign
            </p>
            <Button variant="secondary" size="lg">
              Schedule Free Consultation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}