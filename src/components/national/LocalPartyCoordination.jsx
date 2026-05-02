import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Book, Share2, MessageSquare, FileText, Users, Search, Plus } from 'lucide-react';
import { useState } from 'react';

export default function LocalPartyCoordination() {
  const [activeCategory, setActiveCategory] = useState('scripts');

  const resources = {
    scripts: [
      {
        id: 'script-1',
        title: 'Door Knock Introduction (General)',
        author: 'National Campaign Team',
        version: '2.1',
        downloads: 142,
        lastUpdated: '2026-04-28',
        category: 'Canvassing',
      },
      {
        id: 'script-2',
        title: 'Cost of Living Crisis Response',
        author: 'Brighton Pavilion Campaign',
        version: '1.3',
        downloads: 87,
        lastUpdated: '2026-04-25',
        category: 'Messaging',
      },
      {
        id: 'script-3',
        title: 'Phone Banking: Policy Questions',
        author: 'Manchester Central Team',
        version: '1.0',
        downloads: 54,
        lastUpdated: '2026-04-20',
        category: 'Phone Banking',
      },
    ],
    leaflets: [
      {
        id: 'leaf-1',
        title: 'Climate Crisis 2-Pager',
        author: 'National Design Team',
        version: '3.0',
        downloads: 203,
        lastUpdated: '2026-04-15',
        category: 'Policy Brief',
        format: 'PDF + Editable',
      },
      {
        id: 'leaf-2',
        title: 'NHS Crisis Local Case Studies',
        author: 'Healthcare Campaign Group',
        version: '2.1',
        downloads: 156,
        lastUpdated: '2026-04-10',
        category: 'Specific Issue',
        format: 'Canva Template',
      },
    ],
    policies: [
      {
        id: 'policy-1',
        title: 'Housing: Our Plan for Affordable Homes',
        author: 'Policy Development Team',
        version: '1.0',
        pages: 12,
        lastUpdated: '2026-04-01',
      },
      {
        id: 'policy-2',
        title: 'Climate Emergency: 2030 Target Analysis',
        author: 'Environmental Campaign',
        version: '2.3',
        pages: 8,
        lastUpdated: '2026-03-28',
      },
    ],
  };

  const categories = [
    { id: 'scripts', label: '📋 Canvassing Scripts', icon: Book },
    { id: 'leaflets', label: '📄 Leaflet Templates', icon: FileText },
    { id: 'policies', label: '📑 Policy Documents', icon: MessageSquare },
  ];

  const currentResources = resources[activeCategory] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="w-6 h-6 text-primary" />
              Unified Resource Library
            </h2>
            <p className="text-muted-foreground">
              Shared assets across all 200+ local campaigns
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Upload Resource
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b pb-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCategory === cat.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search resources..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
        />
      </div>

      {/* Resources Grid */}
      <div className="space-y-3">
        {currentResources.map(resource => (
          <Card key={resource.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    By {resource.author} • v{resource.version} • Updated{' '}
                    {new Date(resource.lastUpdated).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{resource.category}</Badge>
                    {resource.format && <Badge variant="outline">{resource.format}</Badge>}
                    {resource.pages && (
                      <Badge variant="outline">{resource.pages} pages</Badge>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-2 flex-shrink-0">
                  <p className="text-sm text-muted-foreground">
                    {resource.downloads} downloads
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                    <Button size="sm">Download</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Messaging Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            National Messaging Framework
          </CardTitle>
          <CardDescription>
            Consistent voter messaging aligned with 15-pillar manifesto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              'Housing & Affordability',
              'NHS & Healthcare',
              'Climate & Environment',
              'Workers & Fair Pay',
              'Cost of Living Crisis',
              'Education',
            ].map(pillar => (
              <div
                key={pillar}
                className="p-3 bg-muted rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-sm">{pillar}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to see 5-10 talking points
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
              <p className="text-3xl font-bold">
                {Object.values(resources).reduce((sum, arr) => sum + arr.length, 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Contributing Campaigns</p>
              <p className="text-3xl font-bold">45</p>
              <p className="text-xs text-muted-foreground">out of 200+</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
              <p className="text-3xl font-bold">1.2k</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Contributors</p>
              <p className="text-3xl font-bold">28</p>
              <p className="text-xs text-muted-foreground">uploading this week</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}