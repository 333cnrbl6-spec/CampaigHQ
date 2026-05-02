import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Lock, FileText, AlertCircle } from 'lucide-react';

export default function Compliance() {
  const certifications = [
    {
      name: 'SOC 2 Type II',
      icon: Shield,
      status: 'Certified',
      description: 'Security, availability, processing integrity, confidentiality, and privacy controls',
      details: ['Annual audits', 'Real-time monitoring', 'Incident response procedures'],
    },
    {
      name: 'GDPR Compliant',
      icon: Lock,
      status: 'Certified',
      description: 'Full compliance with UK and EU data protection regulations',
      details: ['Data Processing Agreements', 'Right to be forgotten', 'Data portability'],
    },
    {
      name: 'ISO 27001',
      icon: FileText,
      status: 'In Progress',
      description: 'Information security management system certification',
      details: ['Target: Q4 2026', 'Security controls', 'Risk management'],
    },
    {
      name: 'Electoral Commission Approved',
      icon: CheckCircle,
      status: 'Pending',
      description: 'Compliance with UK Electoral Commission guidelines',
      details: ['Pre-election audit ready', 'Post-election compliance modules', 'Audit logging'],
    },
  ];

  const policies = [
    {
      title: 'Data Protection Policy',
      type: 'Policy',
      status: 'Active',
      description: 'Comprehensive data handling, storage, and retention procedures',
    },
    {
      title: 'Privacy Policy',
      type: 'Legal',
      status: 'Active',
      description: 'User privacy rights, data collection, and third-party sharing',
    },
    {
      title: 'Terms of Service',
      type: 'Legal',
      status: 'Active',
      description: 'Platform usage terms, liability, and dispute resolution',
    },
    {
      title: 'Security Policy',
      type: 'Policy',
      status: 'Active',
      description: 'Access controls, encryption, and incident response procedures',
    },
    {
      title: 'Acceptable Use Policy',
      type: 'Policy',
      status: 'Active',
      description: 'Prohibited activities and compliance requirements for users',
    },
    {
      title: 'Data Processing Agreement',
      type: 'Legal',
      status: 'Active',
      description: 'GDPR data processor agreement for campaigns and organizations',
    },
  ];

  const features = [
    {
      title: 'Automatic Data Retention',
      description: 'Configurable retention policies automatically purge data after election period',
      compliances: ['GDPR Article 5', 'UK DPA 2018', 'Electoral Commission Guidelines'],
    },
    {
      title: 'Audit Logging',
      description: 'Every action logged with user, timestamp, IP address, and change details',
      compliances: ['Electoral Commission', 'GDPR Art. 32', 'SOC 2 Availability'],
    },
    {
      title: 'Consent Management',
      description: 'Record and verify voter/volunteer consent with date, method, and proof',
      compliances: ['GDPR Article 7', 'UK DPA 2018', 'Electoral Commission'],
    },
    {
      title: 'Right to be Forgotten',
      description: 'One-click deletion of all personal data associated with a contact',
      compliances: ['GDPR Article 17', 'UK DPA 2018'],
    },
    {
      title: 'Data Portability',
      description: 'Export all data in standard formats (CSV, JSON) on demand',
      compliances: ['GDPR Article 20', 'UK DPA 2018'],
    },
    {
      title: 'Encryption at Rest & Transit',
      description: 'AES-256 encryption for stored data, TLS 1.3 for all communications',
      compliances: ['GDPR Article 32', 'SOC 2 Security', 'ISO 27001'],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold">Security & Compliance</h1>
          <p className="text-xl text-muted-foreground">
            Enterprise-grade security with full regulatory compliance
          </p>
        </div>

        {/* Compliance Status */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Certifications & Compliance Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map(cert => {
              const Icon = cert.icon;
              const statusColor =
                cert.status === 'Certified'
                  ? 'bg-green-100 text-green-800'
                  : cert.status === 'In Progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800';
              return (
                <Card key={cert.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-8 h-8 text-primary" />
                      <Badge className={statusColor}>{cert.status}</Badge>
                    </div>
                    <CardTitle>{cert.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{cert.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {cert.details.map(detail => (
                        <li key={detail} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Compliance Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(feature => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Complies With:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {feature.compliances.map(compliance => (
                        <Badge key={compliance} variant="secondary" className="text-xs">
                          {compliance}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Policies & Documentation */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Policies & Legal Documents</h2>
          <div className="grid grid-cols-1 gap-4">
            {policies.map(policy => (
              <Card key={policy.title}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{policy.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <Badge variant="outline">{policy.type}</Badge>
                    <Badge className="bg-green-100 text-green-800">{policy.status}</Badge>
                    <button className="text-primary hover:underline text-sm font-medium">
                      View PDF
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Security */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Security Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Encryption</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ AES-256 encryption at rest</li>
                  <li>✓ TLS 1.3 for data in transit</li>
                  <li>✓ HKDF key derivation</li>
                  <li>✓ Hardware security module (HSM) protected keys</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Access Controls</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ Role-based access control (RBAC)</li>
                  <li>✓ Multi-factor authentication (MFA)</li>
                  <li>✓ IP whitelisting for admin accounts</li>
                  <li>✓ Session management & timeout</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <h4 className="font-semibold mb-3">Infrastructure</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ AWS GovCloud data centers</li>
                  <li>✓ Automated daily backups</li>
                  <li>✓ 99.99% uptime SLA</li>
                  <li>✓ DDoS protection & WAF</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Monitoring & Response</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ 24/7 security monitoring</li>
                  <li>✓ Intrusion detection system</li>
                  <li>✓ 1-hour incident response SLA</li>
                  <li>✓ Monthly security scans</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit & Compliance Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Comprehensive audit trails and compliance reports available for each campaign:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Activity Audit Log',
                  description: 'Every user action with timestamp, IP, and changes',
                },
                {
                  title: 'Data Access Report',
                  description: 'Who accessed what data, when, and why',
                },
                {
                  title: 'Compliance Certificate',
                  description: 'Export compliance proof for electoral audits',
                },
              ].map((item, i) => (
                <Card key={i} className="bg-muted border-none">
                  <CardContent className="pt-4 space-y-2">
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Dashboard */}
        <Card className="bg-accent/10 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              Compliance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Each campaign gets a dedicated compliance dashboard showing:
            </p>
            <ul className="space-y-2 text-sm">
              <li>✓ Current GDPR compliance status</li>
              <li>✓ Data retention timeline</li>
              <li>✓ Pending deletion requests</li>
              <li>✓ Consent audit trail</li>
              <li>✓ Audit log exports</li>
              <li>✓ Electoral Commission readiness</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}