import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, Smartphone, Lock, Zap, Play } from 'lucide-react';

export default function PreLaunchTesting() {
  const [activeTab, setActiveTab] = useState('manual');
  const [checklist, setChecklist] = useState([
    {
      id: 'desktop',
      category: 'Desktop Testing',
      icon: '🖥️',
      items: [
        { id: 'pages', label: 'Test all 20+ pages load correctly', checked: false },
        { id: 'forms', label: 'Submit forms (campaign setup, contact creation)', checked: false },
        { id: 'navigation', label: 'Navigation between pages works', checked: false },
        { id: 'errors', label: 'Error messages display properly', checked: false },
        { id: 'performance', label: 'Pages load in <2 seconds', checked: false },
      ],
    },
    {
      id: 'mobile',
      category: 'Mobile Testing',
      icon: '📱',
      items: [
        { id: 'ios', label: 'Test on iOS Safari (iPhone)', checked: false },
        { id: 'android', label: 'Test on Android Chrome', checked: false },
        { id: 'responsive', label: 'Responsive design on all sizes', checked: false },
        { id: 'touch', label: 'Touch interactions work (buttons, inputs)', checked: false },
        { id: 'offline', label: 'Offline PWA functionality', checked: false },
      ],
    },
    {
      id: 'integrations',
      category: 'Integration Testing',
      icon: '🔗',
      items: [
        { id: 'email', label: 'Email alerts send correctly', checked: false },
        { id: 'slack', label: 'Slack notifications work', checked: false },
        { id: 'import', label: 'Sample data import completes', checked: false },
        { id: 'export', label: 'Data export generates correctly', checked: false },
        { id: 'auth', label: 'Login/logout flow works', checked: false },
      ],
    },
    {
      id: 'gdpr',
      category: 'GDPR & Compliance',
      icon: '⚖️',
      items: [
        { id: 'consent', label: 'Consent tracking records properly', checked: false },
        { id: 'deletion', label: 'Right to be forgotten deletion works', checked: false },
        { id: 'audit', label: 'Audit logs record all changes', checked: false },
        { id: 'export', label: 'Data access export includes all fields', checked: false },
      ],
    },
    {
      id: 'security',
      category: 'Security Testing',
      icon: '🔒',
      items: [
        { id: 'rls', label: 'Row-level security prevents data leaks', checked: false },
        { id: 'xss', label: 'No XSS vulnerabilities in forms', checked: false },
        { id: 'csrf', label: 'CSRF protection on state-changing actions', checked: false },
        { id: 'auth', label: 'Unauthorized users cannot access pages', checked: false },
      ],
    },
  ]);

  const toggleItem = (categoryId, itemId) => {
    setChecklist(checklist.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map(item =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          }
        : cat
    ));
  };

  const getProgress = () => {
    const total = checklist.reduce((sum, cat) => sum + cat.items.length, 0);
    const completed = checklist.reduce(
      (sum, cat) => sum + cat.items.filter(i => i.checked).length,
      0
    );
    return Math.round((completed / total) * 100);
  };

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Pre-Launch Testing</h1>
          <p className="text-muted-foreground">Complete all tests before going live</p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{progress}% complete</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {progress === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">All tests passed! 🚀</p>
                  <p className="text-sm text-green-700">Ready to deploy to production.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Manual Tests
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Security Audit
          </button>
        </div>

        {/* Manual Tests */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            {checklist.map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{category.category}</CardTitle>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {category.items.filter(i => i.checked).length}/{category.items.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(category.id, item.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        {item.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Security Audit */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Audit Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* RLS */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Row-Level Security (RLS)
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Campaign isolation enabled — users can only see their campaign data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Role-based permissions enforced at database level</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Audit logs track all data access</span>
                    </li>
                  </ul>
                </div>

                {/* API Security */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    API Security
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>HTTPS enforced for all requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Rate limiting prevents brute force attacks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>API keys rotated monthly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">⚠</span>
                      <span>CORS configured for production domain only</span>
                    </li>
                  </ul>
                </div>

                {/* Data Protection */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Data Protection
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Encryption at rest enabled</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Sensitive fields (passwords, tokens) hashed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Daily automated backups with test restores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">⚠</span>
                      <span>Verify production database backup location</span>
                    </li>
                  </ul>
                </div>

                {/* GDPR */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    GDPR Compliance
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Privacy policy published and accessible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Consent management implemented</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Right to be forgotten (deletion) working</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">⚠</span>
                      <span>Review DPA with cloud provider</span>
                    </li>
                  </ul>
                </div>

                {/* Recommended Actions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-amber-900 text-sm">Pre-Launch Recommendations</p>
                  <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                    <li>Verify production CORS whitelist includes your domain</li>
                    <li>Test Stripe webhook signature validation</li>
                    <li>Confirm email/Slack integrations with prod credentials</li>
                    <li>Run final database backup and test restore</li>
                    <li>Set up monitoring and alerting (Sentry, UptimeRobot)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}