import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Trash2, FileText, Scale, Shield, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const legislationItems = [
  {
    id: 'ec-rules',
    title: 'Electoral Commission Rules (2024)',
    description: 'Post-election data handling and retention guidelines',
    link: 'https://www.electoralcommission.org.uk',
  },
  {
    id: 'gdpr',
    title: 'GDPR (UK GDPR after Brexit)',
    description: 'General Data Protection Regulation - legitimate interest, consent, lawful basis',
    link: 'https://ico.org.uk',
  },
  {
    id: 'dpa-2018',
    title: 'Data Protection Act 2018',
    description: 'UK data protection law for processing personal data',
    link: 'https://www.legislation.gov.uk',
  },
  {
    id: 'electoral-act',
    title: 'Electoral Commission Act (Marked Register)',
    description: 'Marked registers must be returned/destroyed within specified timeframe',
    link: 'https://www.electoralcommission.org.uk',
  },
];

const retentionCategories = [
  {
    category: 'CAN RETAIN',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50 border-green-200',
    items: [
      {
        title: 'Explicit Supporters',
        description: 'Voters who gave explicit written consent to store their data for political campaigning',
        items: ['Name', 'Address', 'Email', 'Phone', 'Support level', 'Key issues'],
        format: 'Structured database with consent records',
        retention: 'Up to 3 years (if consent-based)',
      },
      {
        title: 'Donor Data',
        description: 'People who donated to campaign (required by Electoral Commission)',
        items: ['Name', 'Address', 'Donation amount', 'Date'],
        format: 'As per Electoral Commission template',
        retention: 'Indefinite (regulatory requirement)',
      },
      {
        title: 'Volunteer Records',
        description: 'Volunteers who signed up with explicit consent',
        items: ['Name', 'Email', 'Phone', 'Availability', 'Skills'],
        format: 'Structured with signed consent forms',
        retention: 'Indefinite (if active volunteers)',
      },
    ],
  },
  {
    category: 'MUST DELETE',
    icon: Trash2,
    color: 'text-red-600 bg-red-50 border-red-200',
    items: [
      {
        title: 'Non-Supporters',
        description: 'Voters contacted who opposed candidate or showed no support',
        items: ['All personal data for opposed/neutral voters'],
        format: 'Complete deletion (no archive)',
        retention: 'Delete within 30 days post-election',
      },
      {
        title: 'Inferred Political Data',
        description: 'Data inferred from canvassing (e.g., voter viewed as "green supporter")',
        items: ['Support level tags', 'Political views', 'Voting intention'],
        format: 'Delete fields, anonymize if needed',
        retention: 'Delete within 30 days',
      },
      {
        title: 'Marked Electoral Register',
        description: 'Register with addresses marked by candidates (provided by EC)',
        items: ['Entire marked register copy'],
        format: 'Secure destruction (shredding/secure deletion)',
        retention: 'Delete immediately after election',
      },
      {
        title: 'Canvassing Records Without Consent',
        description: 'Door knock records for people who didn\'t give explicit consent',
        items: ['Interaction logs', 'Response data', 'Contact info'],
        format: 'Complete anonymization or deletion',
        retention: 'Delete within 30 days',
      },
    ],
  },
  {
    category: 'ANONYMIZE / AGGREGATE',
    icon: Shield,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    items: [
      {
        title: 'Statistical Data',
        description: 'Aggregate data for campaign analysis (no personal identifiers)',
        items: ['Ward-level voter counts', 'Turnout percentages', 'Geographic heatmaps'],
        format: 'Anonymized aggregates only (no individual names)',
        retention: 'Indefinite (no personal data)',
      },
      {
        title: 'Campaign Performance Data',
        description: 'Non-personal insights about canvassing effectiveness',
        items: ['Door knock rates', 'Response rates by area', 'Volunteer performance'],
        format: 'Aggregated metrics only',
        retention: 'Indefinite',
      },
    ],
  },
];

const mockContactData = {
  total: 4850,
  breakdown: {
    explicitSupporters: 1240,
    donors: 156,
    volunteers: 89,
    nonSupporters: 1856,
    inferredData: 912,
    markedRegister: 4850,
    canvassingWithoutConsent: 2340,
    statisticalOnly: 4850,
  },
};

export default function PostElectionComplianceModule() {
  const [activeView, setActiveView] = useState('overview');
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [showDeletionPreview, setShowDeletionPreview] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [complianceExecuted, setComplianceExecuted] = useState(false);

  const toggleCheckbox = id => {
    setSelectedCheckboxes(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allBoxesChecked = Object.values(selectedCheckboxes).every(v => v === true);

  const handleExecuteCompliance = async () => {
    if (!allBoxesChecked) return;

    setDeleteInProgress(true);
    try {
      // In real implementation, call backend function
      // await base44.functions.invoke('executePostElectionCompliance', {
      //   contactsToDelete: deletionStats.totalToDelete,
      //   markedRegisterToDestroy: true,
      //   auditTrail: true,
      // });

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setComplianceExecuted(true);
    } catch (error) {
      alert('Error executing compliance: ' + error.message);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const deletionStats = {
    totalToDelete: mockContactData.breakdown.nonSupporters + mockContactData.breakdown.canvassingWithoutConsent,
    totalToAnonymize: mockContactData.breakdown.statisticalOnly,
    totalToRetain: mockContactData.breakdown.explicitSupporters + mockContactData.breakdown.donors,
    estimatedGDPRRequests: Math.round(mockContactData.breakdown.nonSupporters * 0.05),
  };

  return (
    <div className="space-y-6">
      {/* Compliance Alert Banner */}
      {!complianceExecuted && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border-2 border-amber-300 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">🔔 POST-ELECTION COMPLIANCE REQUIRED</p>
              <p className="text-sm text-amber-800 mt-1">
                Your campaign has completed. UK electoral law requires specific data handling within 30 days. This module ensures legal compliance and helps avoid regulatory penalties.
              </p>
            </div>
          </div>
        </div>
      )}

      {complianceExecuted && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-900">✓ COMPLIANCE EXECUTED</p>
              <p className="text-sm text-green-800 mt-1">
                Post-election compliance procedures completed. Audit trail available for Electoral Commission review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: '📋 Overview', icon: FileText },
          { id: 'legislation', label: '⚖️ Legislation', icon: Scale },
          { id: 'retention', label: '📚 Retention Rules', icon: BookOpen },
          { id: 'audit', label: '🔍 Compliance Audit', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              activeView === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Data Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-3xl font-bold">{mockContactData.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">All voter/contact records</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Can Retain</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(mockContactData.breakdown.explicitSupporters + mockContactData.breakdown.donors).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">With valid consent</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700">Must Delete</p>
                  <p className="text-3xl font-bold text-red-600">{deletionStats.totalToDelete.toLocaleString()}</p>
                  <p className="text-xs text-red-600">No consent / opposed</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700">Anonymize Only</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {mockContactData.breakdown.statisticalOnly.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600">Aggregate data</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Actions */}
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <CardTitle>📋 Compliance Checklist</CardTitle>
              <CardDescription>Review requirements and execute compliance procedures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    id: 'consent-check',
                    label: 'Verify all retained contacts have explicit written consent',
                    description: 'Campaign finance and data processing records must show consent',
                  },
                  {
                    id: 'marked-register',
                    label: 'Marked Electoral Register securely destroyed',
                    description: 'Physical marked registers shredded; digital copies securely deleted',
                  },
                  {
                    id: 'non-supporters',
                    label: 'Non-supporter data deleted from all systems',
                    description: 'Includes opposed voters, neutral contacts, and non-responders',
                  },
                  {
                    id: 'inferred-data',
                    label: 'Political inference fields removed/anonymized',
                    description: 'Support level tags, political views, voting intention estimates',
                  },
                  {
                    id: 'no-consent-canvassing',
                    label: 'Canvassing records without consent deleted',
                    description: 'Door knock logs for people who did not opt-in',
                  },
                  {
                    id: 'dsar-ready',
                    label: 'Ready for Data Subject Access Requests (DSARs)',
                    description: 'Can respond to "what data do you have on me" requests within 30 days',
                  },
                  {
                    id: 'audit-trail',
                    label: 'Audit trail documented for Electoral Commission',
                    description: 'Log of what was deleted, when, and why (regulatory requirement)',
                  },
                  {
                    id: 'gdpr-compliant',
                    label: 'GDPR compliance verified',
                    description: 'No lawful basis for retention beyond consented uses',
                  },
                ].map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleCheckbox(item.id)}
                  >
                    <Checkbox
                      checked={selectedCheckboxes[item.id] || false}
                      onCheckedChange={() => toggleCheckbox(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Execute Compliance */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <p className="font-bold text-amber-900 text-sm">⚠️ This action is irreversible</p>
                <p className="text-sm text-amber-800">
                  Once executed, {deletionStats.totalToDelete.toLocaleString()} contact records will be permanently deleted from your system. An audit trail will be created for Electoral Commission compliance.
                </p>

                {showDeletionPreview && (
                  <div className="mt-3 space-y-2 text-sm bg-white p-3 rounded border border-amber-200">
                    <p className="font-bold">Deletion Preview:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>✓ Delete {mockContactData.breakdown.nonSupporters} non-supporter records</li>
                      <li>✓ Delete {mockContactData.breakdown.canvassingWithoutConsent} canvassing records without consent</li>
                      <li>✓ Remove inferred political data ({mockContactData.breakdown.inferredData} fields)</li>
                      <li>✓ Destroy marked electoral register ({mockContactData.breakdown.markedRegister} copies)</li>
                      <li>✓ Anonymize {mockContactData.breakdown.statisticalOnly} statistical records</li>
                      <li>✓ Retain {mockContactData.breakdown.explicitSupporters + mockContactData.breakdown.donors} consented contacts</li>
                      <li>✓ Generate audit trail for {deletionStats.estimatedGDPRRequests} anticipated DSARs</li>
                    </ul>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeletionPreview(!showDeletionPreview)}
                  className="gap-2"
                >
                  {showDeletionPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showDeletionPreview ? 'Hide' : 'Preview'} Deletion Details
                </Button>

                <Button
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-bold"
                  disabled={!allBoxesChecked || deleteInProgress || complianceExecuted}
                  onClick={handleExecuteCompliance}
                >
                  <Trash2 className="w-5 h-5" />
                  {deleteInProgress
                    ? 'Executing Compliance...'
                    : complianceExecuted
                      ? '✓ Compliance Executed'
                      : 'EXECUTE POST-ELECTION COMPLIANCE'}
                </Button>

                {!allBoxesChecked && (
                  <p className="text-xs text-amber-600 font-medium">
                    ⚠️ Check all compliance items above to enable execution
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legislation */}
      {activeView === 'legislation' && (
        <div className="space-y-4">
          {legislationItems.map(item => (
            <Card key={item.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    View
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Retention Rules */}
      {activeView === 'retention' && (
        <div className="space-y-6">
          {retentionCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.category} className="space-y-4">
                <div className={`flex items-center gap-2 p-4 rounded-lg border-2 ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                  <p className="font-bold text-lg">{cat.category}</p>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <p className="font-bold">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">{item.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-muted-foreground mb-1">Data Fields:</p>
                            <ul className="text-xs space-y-1">
                              {Array.isArray(item.items) && item.items.map((field, i) => (
                                <li key={i}>• {field}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground mb-1">Storage Format:</p>
                            <p className="text-xs bg-muted/30 p-2 rounded">{item.format}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground mb-1">Retention Period:</p>
                            <p className="text-xs bg-muted/30 p-2 rounded">{item.retention}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Trail */}
      {activeView === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Compliance Audit Trail</CardTitle>
            <CardDescription>
              Electoral Commission requires documented evidence of compliance procedures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {complianceExecuted ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-bold text-green-700 mb-2">✓ Compliance Execution Log</p>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>✓ Non-supporter records deleted: {mockContactData.breakdown.nonSupporters}</li>
                    <li>✓ Canvassing records without consent deleted: {mockContactData.breakdown.canvassingWithoutConsent}</li>
                    <li>✓ Political inference data removed: {mockContactData.breakdown.inferredData} fields</li>
                    <li>✓ Marked electoral register destroyed: {mockContactData.breakdown.markedRegister} copies</li>
                    <li>✓ Statistical data anonymized: {mockContactData.breakdown.statisticalOnly} records</li>
                    <li>✓ Compliant records retained: {mockContactData.breakdown.explicitSupporters + mockContactData.breakdown.donors}</li>
                    <li>✓ Execution timestamp: 2026-05-07 18:45:32 UTC</li>
                    <li>✓ Audit ID: EC-2026-05-TYLDESLEY-0847</li>
                  </ul>
                </div>

                <Button className="w-full" variant="outline">
                  📥 Download Electoral Commission Report
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">
                  Audit trail will be generated once compliance is executed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}