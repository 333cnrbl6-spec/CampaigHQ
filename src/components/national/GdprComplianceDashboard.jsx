import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, AlertTriangle, Lock, Trash2, Eye, FileText, Clock } from 'lucide-react';
import { useState } from 'react';

export default function GdprComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock GDPR compliance data
  const complianceMetrics = {
    totalContacts: 45230,
    consentObtained: 38420,
    consentPercentage: 85,
    pendingDeletionRequests: 12,
    completedDeletions: 3,
    dataRetentionExempt: 847,
    lastAuditDate: '2026-04-28',
    nextAuditDate: '2026-05-28',
    soc2Status: 'in-progress',
  };

  const recentDeletionRequests = [
    {
      id: 'gdpr-1',
      contactName: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      requestDate: '2026-05-01',
      requestType: 'right_to_be_forgotten',
      status: 'completed',
      completedDate: '2026-05-02',
      dataDeleted: ['contact_details', 'interaction_history', 'canvassing_notes'],
    },
    {
      id: 'gdpr-2',
      contactName: 'Michael Chen',
      email: 'michael.c@example.com',
      requestDate: '2026-04-30',
      requestType: 'right_to_be_forgotten',
      status: 'pending',
      completedDate: null,
      daysRemaining: 28,
      dataDeleted: [],
    },
    {
      id: 'gdpr-3',
      contactName: 'Emma Williams',
      email: 'emma.w@example.com',
      requestDate: '2026-04-28',
      requestType: 'data_access',
      status: 'completed',
      completedDate: '2026-04-29',
      dataDeleted: [],
    },
  ];

  const auditTrail = [
    {
      id: 'audit-1',
      timestamp: '2026-05-02 14:32',
      action: 'Consent recorded',
      entity: 'Contact ID: 4523',
      user: 'volunteer_alice@campaign.uk',
      method: 'door_knock',
      status: 'success',
    },
    {
      id: 'audit-2',
      timestamp: '2026-05-02 14:15',
      action: 'Contact interaction logged',
      entity: 'Contact ID: 4521',
      user: 'volunteer_bob@campaign.uk',
      method: 'phone_call',
      status: 'success',
    },
    {
      id: 'audit-3',
      timestamp: '2026-05-02 13:48',
      action: 'Deletion request initiated',
      entity: 'Contact ID: 4502',
      user: 'gdpr_officer@national.uk',
      method: 'manual_request',
      status: 'success',
    },
    {
      id: 'audit-4',
      timestamp: '2026-05-02 13:20',
      action: 'Outreach message sent',
      entity: 'Contact ID: 4501',
      user: 'automation_service',
      method: 'email',
      status: 'success',
    },
  ];

  const complianceChecklist = [
    {
      item: 'Lawful Basis for Processing',
      status: 'complete',
      description: 'All processing based on explicit consent',
    },
    {
      item: 'Consent Tracking',
      status: 'complete',
      description: '85% of contacts have recorded consent',
    },
    {
      item: 'Right to Access',
      status: 'complete',
      description: 'Data export available within 30 days',
    },
    {
      item: 'Right to Erasure',
      status: 'complete',
      description: 'Automated deletion within 30 days',
    },
    {
      item: 'Data Retention Policy',
      status: 'complete',
      description: 'Auto-delete after election + 1 year',
    },
    {
      item: 'Privacy Notice',
      status: 'complete',
      description: 'Published on all campaign materials',
    },
    {
      item: 'Data Processing Agreement',
      status: 'in-progress',
      description: 'Under review with legal team',
    },
    {
      item: 'SOC 2 Type II Audit',
      status: 'in-progress',
      description: 'Q3 2026 target completion',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
      case 'complete':
        return 'text-green-600 bg-green-50';
      case 'pending':
      case 'in-progress':
        return 'text-amber-600 bg-amber-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <p className="text-3xl font-bold">{complianceMetrics.totalContacts.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">In database</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-700">Consent Obtained</p>
              <p className="text-3xl font-bold text-green-600">
                {complianceMetrics.consentPercentage}%
              </p>
              <p className="text-xs text-green-600">
                {complianceMetrics.consentObtained.toLocaleString()} contacts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Deletion Requests</p>
              <p className="text-3xl font-bold">{complianceMetrics.pendingDeletionRequests}</p>
              <p className="text-xs text-muted-foreground">
                {complianceMetrics.completedDeletions} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Compliance Status</p>
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-600">GDPR Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3">
        {[
          { id: 'overview', label: '📋 Compliance Overview', icon: FileText },
          { id: 'consent', label: '✓ Consent Tracking', icon: CheckCircle2 },
          { id: 'deletions', label: '🗑️ Deletion Requests', icon: Trash2 },
          { id: 'audit', label: '📊 Audit Trail', icon: Clock },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                GDPR Compliance Checklist
              </CardTitle>
              <CardDescription>
                All requirements for lawful data processing in UK elections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {complianceChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border flex items-start justify-between ${
                    item.status === 'complete'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold">{item.item}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <Badge
                    className={
                      item.status === 'complete'
                        ? 'bg-green-600 ml-3'
                        : 'bg-amber-600 ml-3'
                    }
                  >
                    {item.status === 'complete' ? '✓ Done' : '⏳ In Progress'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">SOC 2 Type II Certification</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Currently in audit process. Target completion: Q3 2026. This will certify
                    security, availability, processing integrity, confidentiality, and privacy
                    controls.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 gap-2">
                    <Eye className="w-4 h-4" />
                    View SOC 2 Roadmap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consent Tracking Tab */}
      {activeTab === 'consent' && (
        <Card>
          <CardHeader>
            <CardTitle>Consent Tracking by Campaign</CardTitle>
            <CardDescription>Track consent collection across all local parties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                campaign: 'Brighton Pavilion',
                total: 4200,
                consented: 3890,
                percentage: 93,
              },
              {
                campaign: 'Cambridge',
                total: 3100,
                consented: 2850,
                percentage: 92,
              },
              {
                campaign: 'Bristol West',
                total: 2800,
                consented: 2240,
                percentage: 80,
              },
              {
                campaign: 'Edinburgh North & Leith',
                total: 1950,
                consented: 1560,
                percentage: 80,
              },
              {
                campaign: 'Oxford East',
                total: 2100,
                consented: 1470,
                percentage: 70,
              },
            ].map(campaign => (
              <div key={campaign.campaign} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{campaign.campaign}</p>
                  <Badge className="bg-primary">{campaign.percentage}% consented</Badge>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${campaign.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {campaign.consented}/{campaign.total}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Deletion Requests Tab */}
      {activeTab === 'deletions' && (
        <div className="space-y-4">
          {recentDeletionRequests.map(request => (
            <Card
              key={request.id}
              className={`border ${
                request.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{request.contactName}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <Badge
                    className={
                      request.status === 'completed'
                        ? 'bg-green-600'
                        : 'bg-amber-600'
                    }
                  >
                    {request.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Request Date</p>
                    <p className="font-medium">{request.requestDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Request Type</p>
                    <p className="font-medium">
                      {request.requestType === 'right_to_be_forgotten'
                        ? 'Right to Erasure'
                        : 'Data Access'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {request.status === 'completed' ? 'Completed' : 'Days Remaining'}
                    </p>
                    <p className="font-medium">
                      {request.status === 'completed'
                        ? request.completedDate
                        : `${request.daysRemaining} days`}
                    </p>
                  </div>
                </div>

                {request.dataDeleted.length > 0 && (
                  <div className="p-2 bg-white/50 rounded text-sm">
                    <p className="font-medium mb-1">Data Deleted:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {request.dataDeleted.map(item => (
                        <li key={item}>• {item.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Processing Audit Trail</CardTitle>
            <CardDescription>Complete log of all data processing activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditTrail.map(entry => (
                <div key={entry.id} className="p-3 bg-muted rounded-lg border text-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.entity}</p>
                    </div>
                    <Badge
                      className={`${
                        entry.status === 'success'
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Time: {entry.timestamp}</span>
                    <span>User: {entry.user}</span>
                    <span>Method: {entry.method}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Export Compliance Reports</CardTitle>
          <CardDescription>Generate reports for audits and regulatory bodies</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            GDPR Compliance Report
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Data Processing Log
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Consent Audit Trail
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}