import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FileText, BookOpen, CheckCircle } from 'lucide-react';

export default function TrainingCenter() {
  const [completedModules, setCompletedModules] = useState([]);

  const videos = [
    {
      id: 'admin-setup',
      title: 'Admin Setup & Configuration',
      duration: '12 min',
      description: 'Learn how to configure your campaign, invite team members, and set up permissions.',
      url: '#',
    },
    {
      id: 'volunteer-onboarding',
      title: 'Volunteer Onboarding',
      duration: '8 min',
      description: 'Guide volunteers through profile setup, consent, and canvassing preparation.',
      url: '#',
    },
    {
      id: 'field-canvassing',
      title: 'Field Canvassing Guide',
      duration: '10 min',
      description: 'Mobile app tutorial for door-to-door canvassing, logging interactions, and data entry.',
      url: '#',
    },
    {
      id: 'data-import',
      title: 'Importing Voter Data',
      duration: '7 min',
      description: 'Step-by-step guide to importing voter lists, geocoding, and validating data quality.',
      url: '#',
    },
    {
      id: 'reporting',
      title: 'Analytics & Reporting',
      duration: '9 min',
      description: 'Understanding dashboards, reports, and exporting data for analysis.',
      url: '#',
    },
    {
      id: 'gdpr-compliance',
      title: 'GDPR & Data Protection',
      duration: '11 min',
      description: 'Managing consent, handling data deletion requests, and audit logging.',
      url: '#',
    },
  ];

  const docs = [
    {
      title: 'Quick Start Guide',
      description: 'Get your campaign up and running in 15 minutes.',
      file: 'quick-start.pdf',
    },
    {
      title: 'Canvassing Best Practices',
      description: 'Tips for effective door-to-door outreach and voter engagement.',
      file: 'canvassing-guide.pdf',
    },
    {
      title: 'Data Management',
      description: 'How to manage contacts, turfs, and volunteer assignments.',
      file: 'data-management.pdf',
    },
    {
      title: 'GDPR Compliance Checklist',
      description: 'Ensure your campaign meets data protection regulations.',
      file: 'gdpr-checklist.pdf',
    },
    {
      title: 'Troubleshooting Guide',
      description: 'Common issues and how to resolve them.',
      file: 'troubleshooting.pdf',
    },
  ];

  const faqs = [
    {
      q: 'How do I invite team members?',
      a: 'Go to Settings → Campaign Members → Invite. Enter their email and role. They\'ll receive an email with a join link.',
    },
    {
      q: 'Can I import voter data from Excel?',
      a: 'Yes! Go to Data Import → Upload CSV/Excel file. The system will validate and geocode contacts automatically.',
    },
    {
      q: 'What\'s a turf?',
      a: 'A turf is a geographic area assigned to volunteers for canvassing. You can draw turfs on the map or import from files.',
    },
    {
      q: 'How do I track volunteer progress?',
      a: 'The Leaderboard shows real-time stats. The Live Map shows volunteer locations during shifts.',
    },
    {
      q: 'Is my data GDPR compliant?',
      a: 'Yes. The platform logs all consent, handles deletion requests, and maintains audit trails automatically.',
    },
    {
      q: 'Can I export reports?',
      a: 'Yes. All dashboards have export buttons. Go to Reports → Export for comprehensive campaign analysis.',
    },
  ];

  const toggleModule = (moduleId) => {
    setCompletedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">Training Center</h1>
          <p className="text-muted-foreground mt-2">Learn how to use the platform effectively.</p>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              Video Tutorials
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <FileText className="w-4 h-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <BookOpen className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <div className="grid gap-4">
              {videos.map((video) => (
                <Card key={video.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{video.title}</h3>
                          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                            {video.duration}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{video.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Watch
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleModule(video.id)}
                        >
                          {completedModules.includes(video.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-muted rounded-full" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm">
              ✓ Completed: {completedModules.length} / {videos.length} modules
            </div>
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent value="docs" className="space-y-4">
            <div className="grid gap-4">
              {docs.map((doc, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Download PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            {faqs.map((item, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.a}</CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Support */}
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base">Still need help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Contact our support team:</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                📧 support@campaign.local
              </Button>
              <Button variant="outline" size="sm">
                💬 Live Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}