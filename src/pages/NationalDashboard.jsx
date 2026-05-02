import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Users, TrendingUp, AlertCircle, BarChart3, Map, Calendar, Book, Target, Send, Zap, Shield } from 'lucide-react';
import { useState } from 'react';
import ConstituencyGrid from '@/components/national/ConstituencyGrid';
import VolunteerCapacityMeter from '@/components/national/VolunteerCapacityMeter';
import WardBreakdown from '@/components/national/WardBreakdown';
import VolunteerShiftScheduling from '@/components/national/VolunteerShiftScheduling';
import LocalPartyCoordination from '@/components/national/LocalPartyCoordination';
import VoterTargeting from '@/components/national/VoterTargeting';
import OutreachAutomation from '@/components/national/OutreachAutomation';
import ElectoralIntelligence from '@/components/national/ElectoralIntelligence';
import GdprComplianceDashboard from '@/components/national/GdprComplianceDashboard';

export default function NationalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: allCampaigns = [], isLoading } = useQuery({
    queryKey: ['all-campaigns', user?.role],
    queryFn: () => base44.entities.Campaign.list('name', 5000),
    enabled: user?.role === 'admin',
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ['all-contacts', user?.role],
    queryFn: () => base44.entities.Contact.list('name', 50000),
    enabled: user?.role === 'admin',
  });

  // Only admins can see this
  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">Only national admins can view this dashboard.</p>
      </div>
    );
  }

  // Calculate stats by campaign
  const campaignStats = allCampaigns.map(c => {
    const contacts = allContacts.filter(ct => ct.campaign_id === c.id);
    const canvassed = contacts.filter(ct => ct.canvassed).length;
    const canvassPct = contacts.length > 0 ? Math.round((canvassed / contacts.length) * 100) : 0;
    return {
      ...c,
      contactCount: contacts.length,
      canvassingProgress: canvassPct,
    };
  });

  const totalCampaigns = allCampaigns.length;
  const totalContacts = allContacts.length;
  const avgCanvassPct = campaignStats.length > 0
    ? Math.round(campaignStats.reduce((sum, c) => sum + c.canvassingProgress, 0) / campaignStats.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold">National Campaign Overview</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time view across all {totalCampaigns} constituent campaigns
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b pt-4 overflow-x-auto pb-2">
            {[
              { id: 'overview', label: '📊 Overview', icon: BarChart3 },
              { id: 'constituencies', label: '🗳️ Constituencies', icon: MapPin },
              { id: 'volunteers', label: '👥 Volunteer Capacity', icon: Users },
              { id: 'wards', label: '🗺️ Ward Breakdown', icon: Map },
              { id: 'shifts', label: '📅 Shift Scheduling', icon: Calendar },
              { id: 'resources', label: '📚 Resources', icon: Book },
              { id: 'targeting', label: '🎯 Voter Targeting', icon: Target },
              { id: 'outreach', label: '📧 Outreach', icon: Send },
              { id: 'electoral', label: '⚡ Electoral Intel', icon: Zap },
              { id: 'compliance', label: '🛡️ GDPR', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                    <p className="text-3xl font-bold">{totalCampaigns}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                    <p className="text-3xl font-bold">{totalContacts.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg. Canvassing</p>
                    <p className="text-3xl font-bold">{avgCanvassPct}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                    <p className="text-3xl font-bold">{allCampaigns.filter(c => c.status === 'active').length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign list */}
            <Card>
              <CardHeader>
                <CardTitle>All Campaigns</CardTitle>
                <CardDescription>Sorted by canvassing progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaignStats
                    .sort((a, b) => b.canvassingProgress - a.canvassingProgress)
                    .map(campaign => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                            <h3 className="font-semibold truncate">{campaign.name}</h3>
                            <Badge
                              variant={campaign.status === 'active' ? 'default' : 'secondary'}
                              className="flex-shrink-0"
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {campaign.candidate_name} • {campaign.constituency}
                          </p>
                        </div>

                        <div className="text-right space-y-1 flex-shrink-0 ml-4">
                          <div className="flex items-center gap-2 justify-end">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{campaign.contactCount.toLocaleString()} contacts</span>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{campaign.canvassingProgress}% canvassed</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'constituencies' && <ConstituencyGrid campaigns={campaignStats} />}
        {activeTab === 'volunteers' && <VolunteerCapacityMeter campaigns={campaignStats} />}
        {activeTab === 'wards' && <WardBreakdown campaigns={campaignStats} />}
        {activeTab === 'shifts' && <VolunteerShiftScheduling campaigns={campaignStats} />}
        {activeTab === 'resources' && <LocalPartyCoordination />}
        {activeTab === 'targeting' && <VoterTargeting />}
        {activeTab === 'outreach' && <OutreachAutomation />}
        {activeTab === 'electoral' && <ElectoralIntelligence campaigns={campaignStats} />}
        {activeTab === 'compliance' && <GdprComplianceDashboard />}

        {/* Export all data */}
        <Card>
          <CardHeader>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Export all campaign data for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="gap-2">
              📊 Export All Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}