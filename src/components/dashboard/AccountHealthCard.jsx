import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';

export default function AccountHealthCard({ subscription, usage, contacts }) {
  // Calculate health score
  let healthScore = 100;
  const issues = [];

  // Check subscription status
  if (subscription?.status === 'past_due') {
    healthScore -= 30;
    issues.push({ type: 'error', label: 'Payment overdue', action: 'Update payment' });
  } else if (subscription?.status === 'trial' && subscription?.trial_end_date) {
    const daysLeft = Math.ceil((new Date(subscription.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      healthScore -= 15;
      issues.push({ type: 'warning', label: `Trial ends in ${daysLeft} days`, action: 'Upgrade plan' });
    }
  }

  // Check contact limits
  if (contacts && subscription?.contact_limit) {
    const usage_pct = (contacts / subscription.contact_limit) * 100;
    if (usage_pct >= 90) {
      healthScore -= 10;
      issues.push({ type: 'warning', label: 'Approaching contact limit', action: 'View limits' });
    }
  }

  // Check data freshness
  if (usage?.contacts_created === 0) {
    healthScore -= 5;
    issues.push({ type: 'info', label: 'No contacts imported yet', action: 'Import data' });
  }

  const getHealthColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getHealthBg = (score) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Account Health</span>
          <Badge variant="secondary" className={`${getHealthColor(healthScore)} border-current`}>
            {healthScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health bar */}
        <div className={`rounded-lg border p-3 ${getHealthBg(healthScore)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Health Score</span>
            <span className={`text-lg font-bold ${getHealthColor(healthScore)}`}>{healthScore}%</span>
          </div>
          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                healthScore >= 85
                  ? 'bg-green-600'
                  : healthScore >= 70
                  ? 'bg-amber-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Issues to address</p>
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                {issue.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                {issue.type === 'warning' && <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                {issue.type === 'info' && <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 text-xs">
                  <p className="font-medium">{issue.label}</p>
                  <p className="text-muted-foreground">{issue.action}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Everything looks good!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}