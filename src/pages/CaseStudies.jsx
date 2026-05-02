import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

export default function CaseStudies() {
  const cases = [
    {
      title: 'Tyldesley Green Party Victory',
      location: 'Wigan, North West England',
      candidate: 'Emma Thompson',
      year: 2026,
      result: 'Won with 127-vote margin',
      description:
        'First Green candidate elected in the constituency using data-driven canvassing.',
      metrics: [
        { label: 'Contacts canvassed', value: '24,500', icon: Users },
        { label: 'Conversion rate', value: '34%', icon: TrendingUp },
        { label: 'Door knocks', value: '18,200', icon: Target },
        { label: 'Volunteers coordinated', value: '87', icon: BarChart3 },
      ],
      quote:
        'The platform let us focus on conversations instead of spreadsheets. That time saved was crucial.',
      author: 'Emma Thompson, Candidate',
      challenges: [
        'Coordinating 87 volunteers across dispersed ward areas',
        'Tracking voter sentiment in real-time',
        'Optimizing canvassing routes to maximize door knocks',
      ],
      solution: [
        'Deployed turf management system with GPS tracking',
        'Real-time contact sentiment tracking with support level scoring',
        'AI-powered route optimization reducing travel time by 23%',
      ],
      stats: {
        contactsAdded: '24,500',
        volunteersActive: '87',
        doorsKnocked: '18,200',
        daysOfCampaigning: '45',
        finalMargin: '127 votes',
      },
    },
    {
      title: 'Regional Multi-Seat Campaign',
      location: '5 constituencies, North West',
      candidate: 'Multi-candidate network',
      year: 2026,
      result: '3 of 5 seats won',
      description: 'Coordinated campaign across five target constituencies.',
      metrics: [
        { label: 'Total contacts', value: '185,000', icon: Users },
        { label: 'Volunteers', value: '340', icon: Users },
        { label: 'Constituencies', value: '5', icon: Target },
        { label: 'Success rate', value: '60%', icon: BarChart3 },
      ],
      quote:
        'National coordination at the speed of a local campaign. This platform made it possible.',
      author: 'Regional Campaign Coordinator',
      challenges: [
        'Managing 340 volunteers across 5 constituencies',
        'Maintaining message consistency while localizing strategy',
        'Real-time data aggregation and reporting',
      ],
      solution: [
        'Centralized national dashboard with per-constituency views',
        'Automated outreach sequences with local message variants',
        'Live metrics and performance dashboards updated hourly',
      ],
      stats: {
        contactsAdded: '185,000',
        volunteersActive: '340',
        doorsKnocked: '156,200',
        daysOfCampaigning: '52',
        seatsWon: '3 of 5',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold">Campaign Success Stories</h1>
          <p className="text-xl text-muted-foreground">
            Real results from real campaigns using our platform
          </p>
        </div>

        {/* Case Studies */}
        {cases.map((caseStudy, i) => (
          <div key={i} className="space-y-8">
            {/* Header */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-heading font-bold">{caseStudy.title}</h2>
                    <p className="text-muted-foreground">{caseStudy.location}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-green-100 text-green-800">{caseStudy.year}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{caseStudy.result}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
                <p className="text-lg text-foreground">{caseStudy.description}</p>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {caseStudy.metrics.map(metric => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.label}>
                    <CardContent className="pt-6 text-center space-y-2">
                      <Icon className="w-6 h-6 text-primary mx-auto" />
                      <p className="text-3xl font-bold">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quote */}
            <Card className="bg-muted border-none">
              <CardContent className="pt-6 space-y-3">
                <p className="text-lg italic">"{caseStudy.quote}"</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  — {caseStudy.author}
                </p>
              </CardContent>
            </Card>

            {/* Challenge & Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {caseStudy.challenges.map((challenge, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-destructive">•</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {caseStudy.solution.map((sol, j) => (
                      <li key={j} className="text-sm text-foreground flex gap-2">
                        <span className="text-green-600">✓</span>
                        {sol}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Results Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(caseStudy.stats).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {i < cases.length - 1 && <hr className="my-8" />}
          </div>
        ))}

        {/* CTA */}
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-8 text-center space-y-4">
            <h3 className="text-2xl font-heading font-bold">Ready to win your campaign?</h3>
            <p className="text-primary-foreground/90">
              Join successful campaigns using our platform. Start your free 30-day trial today.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              Start Free Trial <TrendingUp className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}