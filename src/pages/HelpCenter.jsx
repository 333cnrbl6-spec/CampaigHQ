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
        q: 'How do I create a new campaign?',
        a: 'Go to Campaign Setup, select "New Campaign", and fill in your campaign details. You\'ll get an invite code to share with volunteers.',
      },
      {
        q: 'How do I invite volunteers?',
        a: 'Share your campaign\'s invite code with volunteers. They can join via the Campaign Setup page by entering the code.',
      },
      {
        q: 'What\'s the difference between admin and user roles?',
        a: 'Admins manage campaigns, users, and billing. Users participate in campaigns. Only one admin per campaign.',
      },
    ],
  },
  {
    category: 'Canvassing & Field Work',
    items: [
      {
        q: 'How do I log canvassing activity?',
        a: 'Use Field Mode or the Canvassing Activity page. Log doors knocked, responses, and leaflets delivered.',
      },
      {
        q: 'Can I work offline?',
        a: 'Field Mode supports offline mode. Your data syncs when connectivity returns.',
      },
      {
        q: 'How do I optimize my route?',
        a: 'Go to Route Optimizer, select a turf area, and the system generates an efficient walking route.',
      },
    ],
  },
  {
    category: 'Data & Contacts',
    items: [
      {
        q: 'How do I import voter lists?',
        a: 'Use Data Import to upload CSV/Excel files. The system validates and geocodes addresses automatically.',
      },
      {
        q: 'What\'s geocoding and why is it needed?',
        a: 'Geocoding converts addresses to map coordinates. It\'s needed for routing, mapping, and location-based features.',
      },
      {
        q: 'How do I handle GDPR requests?',
        a: 'Go to GDPR Compliance, log a "Right to be Forgotten" request. The system handles deletion automatically.',
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
    title: 'Setting Up Your First Campaign',
    duration: '5 min',
    description: 'Walk through creating a campaign and inviting your team.',
  },
  {
    title: 'Field Canvassing 101',
    duration: '8 min',
    description: 'Learn how to use Field Mode for door-to-door canvassing.',
  },
  {
    title: 'Route Planning & Optimization',
    duration: '6 min',
    description: 'Optimize volunteer routes for maximum coverage.',
  },
  {
    title: 'Importing Voter Data',
    duration: '7 min',
    description: 'Upload and process voter lists for your campaign.',
  },
];

const docs = [
  {
    title: 'Campaign Manager User Guide',
    size: 'PDF · 12 pages',
    description: 'Complete guide for organizers managing campaigns.',
  },
  {
    title: 'Volunteer Handbook',
    size: 'PDF · 8 pages',
    description: 'Quick reference for volunteers in the field.',
  },
  {
    title: 'Data Import & Validation',
    size: 'PDF · 5 pages',
    description: 'Technical guide for importing and cleaning voter data.',
  },
  {
    title: 'GDPR & Data Compliance',
    size: 'PDF · 6 pages',
    description: 'Legal requirements and how the system enforces them.',
  },
  {
    title: 'API Integration Guide',
    size: 'PDF · 10 pages',
    description: 'For developers integrating with external systems.',
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