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
        a: 'Campaign setup takes ~5 minutes. Create campaign, import voter list (5-10 mins), assign volunteers to turfs (2 mins), launch canvassing. Full onboarding in Training Center.',
      },
      {
        q: 'Do you offer a free trial?',
        a: 'Yes — 30-day free trial on all plans. No credit card required. Full feature access including mobile app, reporting, and integrations. Cancel anytime.',
      },
      {
        q: 'How many volunteers and contacts can I have?',
        a: 'Starter: 10 volunteers, 5K contacts. Professional: 100 volunteers, 50K contacts. Enterprise: unlimited. All plans include unlimited campaign users (managers, organizers).',
      },
      {
        q: 'Can I upgrade mid-campaign?',
        a: 'Yes. Change plans anytime with prorated billing. Add extras like SMS, advanced analytics, or training at any time during your campaign.',
      },
    ],
  },
  {
    category: 'Canvassing & Field Work',
    items: [
      {
        q: 'How does the mobile app work?',
        a: 'Volunteers see their assigned contacts sorted by proximity to current location. Log each door knock with support level (Strong/Leaning/Undecided/Opposed) and outcome. Contacts show previous notes and interaction history. Works offline with automatic sync when reconnected.',
      },
      {
        q: 'How is volunteer safety managed?',
        a: 'Automatic welfare check-ins every 30 minutes. If volunteer doesn\'t respond, team lead gets alert. Optional GPS tracking (with consent) shows location on live map. Emergency contact details linked to each session.',
      },
      {
        q: 'What real-time features are available?',
        a: 'Live leaderboards show doors knocked, support breakdown, and volunteer rankings. Campaign dashboard updates in real-time with canvassing progress, coverage map, and session summaries. Team leads see active volunteers on map.',
      },
      {
        q: 'Does the app work offline?',
        a: 'Yes. Full offline support — all door knocks, notes, and interactions save locally. Auto-syncs when WiFi/mobile returns. Works even with no internet connection.',
      },
    ],
  },
  {
    category: 'Data & Contacts',
    items: [
      {
        q: 'What data formats can I import?',
        a: 'CSV, Excel (.xlsx), JSON, PDF, Word documents. Electoral register spreadsheets auto-parse postcodes and turf zones. Required: name, address, postcode. Optional: phone, email, support level, notes, tags.',
      },
      {
        q: 'How do I handle duplicate contacts?',
        a: 'Use automated Deduplicate tool in Data Import. Scans for duplicate addresses and merges them intelligently. Also prevents duplicates during import by matching existing records.',
      },
      {
        q: 'Is voter data secure and compliant?',
        a: 'Yes. AES-256 encryption at rest, TLS 1.3 in transit. Row-level security — users only access their campaign data. Complete audit trail, GDPR compliant, SOC 2 certified.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. Export full contacts, interactions, and reports as CSV or JSON anytime. We keep data for 12 months post-election, then delete unless you request retention.',
      },
      {
        q: 'How do I process GDPR deletion requests?',
        a: 'Go to GDPR Compliance → Right to Be Forgotten. Search contact, request deletion. System auto-deletes data within 30 days and maintains audit log for compliance proof.',
      },
    ],
  },
  {
    category: 'Reporting & Analytics',
    items: [
      {
        q: 'What reports and dashboards are available?',
        a: 'Campaign Dashboard with live progress, support breakdown, and coverage map. Canvassing Reports with progress by area, volunteer leaderboard, issue tracking. National Dashboard for multi-campaign overview. Weekly reports, post-election analysis, GDPR compliance audit.',
      },
      {
        q: 'Can I export data and reports?',
        a: 'Yes. Go to Data Export, choose format (CSV, JSON, PDF). Export full contacts, interactions, reports, turf sheets. All respects GDPR filters and audit logs.',
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