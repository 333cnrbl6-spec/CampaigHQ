import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Play, FileText, MessageCircle, ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How long does setup take?',
        a: 'Campaign setup takes ~5 minutes. Import contacts (5 mins), assign volunteers (2 mins), start canvassing (live). Full onboarding available in Training Center.',
      },
      {
        q: 'Do you offer a free trial?',
        a: 'Yes — 30-day free trial on all plans. No credit card required. Full access to all features. Cancel anytime.',
      },
      {
        q: 'Can I invite an unlimited number of volunteers?',
        a: 'Yes. All plans include unlimited users. Each volunteer gets their own mobile app login and can work simultaneously.',
      },
      {
        q: 'What if I need to add more features mid-campaign?',
        a: 'Upgrade anytime with prorated billing. Or contact sales for custom setup — we support add-ons like SMS, integrations, and training.',
      },
    ],
  },
  {
    category: 'Canvassing & Field Work',
    items: [
      {
        q: 'How does the mobile app work in the field?',
        a: 'Volunteers open the app on their phone, see their assigned turf/street, and log door responses. The app shows support levels, previous notes, and proximity. Works fully offline — syncs when reconnected.',
      },
      {
        q: 'How do we track volunteer safety?',
        a: 'Volunteers get a welfare check-in every 30 minutes. If they don\'t check in, team leads get an alert. GPS location (with consent) allows real-time tracking on the live map.',
      },
      {
        q: 'Can volunteers see real-time leaderboards?',
        a: 'Yes. The app shows live leaderboards with doors knocked, support levels, and rankings. Updates in real-time to encourage friendly competition.',
      },
      {
        q: 'What happens if volunteers work offline?',
        a: 'All interactions save locally on the phone. When reconnected to WiFi/mobile, data syncs automatically. No data loss.',
      },
    ],
  },
  {
    category: 'Data & Contacts',
    items: [
      {
        q: 'What data formats can I import?',
        a: 'CSV, Excel (.xlsx), and TMC (Targeted Micro Canvassing) format. Required columns: name, address, postcode. Optional: phone, email, support level, notes.',
      },
      {
        q: 'How do I prevent duplicate contacts?',
        a: 'Use Deduplicate tool (Contacts → Data Tools). It automatically finds addresses appearing multiple times and merges them, keeping one primary record.',
      },
      {
        q: 'Is my voter data secure?',
        a: 'Yes. All data encrypted at rest and in transit (HTTPS). Row-level security ensures users only see their campaign\'s data. Full audit trail of all access.',
      },
      {
        q: 'Can I own my data after the campaign?',
        a: 'Yes. Download your full contact list and interaction history anytime as CSV. We retain data for 12 months post-election, then delete unless you ask us to keep it.',
      },
      {
        q: 'How do I handle GDPR right-to-be-forgotten requests?',
        a: 'Go to GDPR Compliance, log request with contact email. System automatically anonymizes/deletes their data within 30 days. Audit log maintained for compliance.',
      },
    ],
  },
  {
    category: 'Reporting & Analytics',
    items: [
      {
        q: 'What reports are available?',
        a: 'Reports include: Canvassing Progress, Volunteer Leaderboard, Issue Tracking, and National Overview (admins).',
      },
      {
        q: 'Can I export campaign data?',
        a: 'Yes, go to Data Export and choose your format (CSV, JSON). All data respects GDPR filters.',
      },
    ],
  },
];

const tutorials = [
  {
    title: 'Campaign Setup Walkthrough',
    duration: '5 min',
    description: 'Create a campaign, set up your team, and invite your first volunteers.',
  },
  {
    title: 'Field Canvassing: Volunteer Edition',
    duration: '6 min',
    description: 'How to use the mobile app: logging responses, offline mode, leaderboards.',
  },
  {
    title: 'Organizing: Managing Your Campaign',
    duration: '8 min',
    description: 'Assigning turfs, tracking volunteers, viewing real-time reports.',
  },
  {
    title: 'Importing Voter Data',
    duration: '7 min',
    description: 'Import CSV/Excel, validate, geocode, and deduplicate contacts.',
  },
  {
    title: 'GDPR & Data Compliance',
    duration: '5 min',
    description: 'Consent tracking, right-to-be-forgotten requests, audit logs.',
  },
  {
    title: 'Reports & Analytics',
    duration: '6 min',
    description: 'Run reports, export data, analyze canvassing performance.',
  },
];

const docs = [
  {
    title: 'User Guide (Complete)',
    size: 'MD · 12 sections',
    description: 'Full documentation: campaign setup, field work, reporting, compliance, troubleshooting, FAQ.',
  },
  {
    title: 'Quick Start Guide',
    size: 'PDF · 4 pages',
    description: 'Get running in 15 minutes: create campaign, import contacts, start canvassing.',
  },
  {
    title: 'Volunteer Mobile App Guide',
    size: 'PDF · 6 pages',
    description: 'Field canvassing reference: using the app, logging responses, offline mode, safety features.',
  },
  {
    title: 'Data Import & Deduplication',
    size: 'PDF · 5 pages',
    description: 'Import CSV/Excel, handle duplicates, geocode addresses, validate data.',
  },
  {
    title: 'GDPR & Data Compliance',
    size: 'PDF · 7 pages',
    description: 'Consent management, right-to-be-forgotten, audit logs, data retention, DPA requirements.',
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const filteredFaqs = faqs
    .map(category => ({
      ...category,
      items: category.items.filter(
        item =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-b p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-heading font-bold">Help Center</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Get answers, watch tutorials, and find documentation.
          </p>

          {/* Search */}
          <div className="relative pt-2">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-11"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <Tabs defaultValue="faqs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="docs">Documents</TabsTrigger>
          </TabsList>

          {/* FAQs */}
          <TabsContent value="faqs" className="space-y-6">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No results found. Try a different search.</p>
              </div>
            ) : (
              filteredFaqs.map(category => (
                <div key={category.category} className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary">{category.category}</h3>
                  <div className="space-y-2">
                    {category.items.map((item, idx) => (
                      <Card
                        key={idx}
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() =>
                          setExpandedFaq(expandedFaq === `${category.category}-${idx}` ? null : `${category.category}-${idx}`)
                        }
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{item.q}</h4>
                              {expandedFaq === `${category.category}-${idx}` && (
                                <p className="text-sm text-muted-foreground mt-3">{item.a}</p>
                              )}
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                                expandedFaq === `${category.category}-${idx}` ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tutorials */}
          <TabsContent value="tutorials" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {tutorials.map((tutorial, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base flex items-start gap-2">
                      <Play className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      {tutorial.title}
                    </CardTitle>
                    <CardDescription className="text-xs">{tutorial.duration}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                    <Button size="sm" className="w-full">
                      Watch Tutorial
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Docs */}
          <TabsContent value="docs" className="space-y-4">
            <div className="grid gap-4">
              {docs.map((doc, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">{doc.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{doc.size}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <MessageCircle className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold">Still need help?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact our support team or check the in-app guidance tooltips for context-specific help.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}