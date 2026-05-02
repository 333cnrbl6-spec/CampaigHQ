import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Search, Download, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import DataFetchError from '@/components/DataFetchError';

const actionIcons = {
  create: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  update: <AlertCircle className="w-4 h-4 text-blue-600" />,
  delete: <AlertCircle className="w-4 h-4 text-red-600" />,
  export: <Download className="w-4 h-4 text-purple-600" />,
  gdpr_request: <Shield className="w-4 h-4 text-orange-600" />,
};

export default function ComplianceAudit() {
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  // Fetch audit logs
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['audit-logs', campaign?.id, dateRange],
    queryFn: async () => {
      const query = { campaign_id: campaign?.id };
      const allLogs = await base44.asServiceRole.entities.AuditLog.list('created_date', 5000);
      
      // Filter by date range
      const now = new Date();
      const days = parseInt(dateRange);
      const cutoff = new Date(now.getTime() - days * 86400000);
      
      return allLogs.filter(log => new Date(log.created_date) >= cutoff);
    },
  });

  // Only admins can view audit logs
  if (user?.role !== 'admin') {
    return (
      <div className="p-8">
        <DataFetchError title="Admin Access Required" error={{ message: 'Only admins can view audit logs.' }} />
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const emailMatch = !searchEmail || log.user_email.toLowerCase().includes(searchEmail.toLowerCase());
    const actionMatch = !searchAction || log.action.includes(searchAction);
    return emailMatch && actionMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <DataFetchError error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Summary stats
  const uniqueUsers = new Set(logs.map(l => l.user_email)).size;
  const gdprRequests = logs.filter(l => l.action === 'gdpr_request').length;
  const exports = logs.filter(l => l.action === 'export').length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">Compliance & Audit Trail</h1>
          <p className="text-muted-foreground mt-2">Complete record of all user actions, data access, and GDPR requests.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Events</p>
                <p className="text-3xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Last {dateRange}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Active Users</p>
                <p className="text-3xl font-bold">{uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Made audit entries</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">GDPR Requests</p>
                <p className="text-3xl font-bold">{gdprRequests}</p>
                <p className="text-xs text-muted-foreground">{exports} data exports</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
            <TabsTrigger value="gdpr">GDPR Requests</TabsTrigger>
          </TabsList>

          {/* Audit Logs */}
          <TabsContent value="logs" className="space-y-4">
            {/* Filters */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium">User Email</label>
                <Input
                  placeholder="Search email..."
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Action Type</label>
                <select
                  value={searchAction}
                  onChange={e => setSearchAction(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="export">Export</option>
                  <option value="gdpr">GDPR Request</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date Range</label>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>

            {/* Log List */}
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-muted-foreground">No audit logs found.</p>
                </Card>
              ) : (
                filteredLogs.map((log, idx) => (
                  <Card key={idx} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">{actionIcons[log.action] || <FileText className="w-4 h-4 text-gray-600" />}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{log.user_email}</span>
                            <Badge variant="secondary" className="text-xs">
                              {log.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                          </p>
                          {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                          {(log.old_values || log.new_values) && (
                            <details className="mt-2 text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View changes
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded space-y-1">
                                {log.old_values && Object.keys(log.old_values).length > 0 && (
                                  <div>
                                    <p className="font-mono text-xs text-red-600">
                                      - {JSON.stringify(log.old_values).substring(0, 100)}
                                    </p>
                                  </div>
                                )}
                                {log.new_values && Object.keys(log.new_values).length > 0 && (
                                  <div>
                                    <p className="font-mono text-xs text-green-600">
                                      + {JSON.stringify(log.new_values).substring(0, 100)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Compliance Report */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Processing Compliance</CardTitle>
                <CardDescription>GDPR & data protection audit summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Full Audit Trail</p>
                      <p className="text-xs text-muted-foreground">All user actions logged with timestamps and IP addresses</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Change Tracking</p>
                      <p className="text-xs text-muted-foreground">Before/after values recorded for all data modifications</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">GDPR Requests</p>
                      <p className="text-xs text-muted-foreground">Right to be forgotten, data access, consent withdrawal tracked</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Data Export Logging</p>
                      <p className="text-xs text-muted-foreground">All data exports tracked with user, date, and scope</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full gap-2" variant="outline">
                  <Download className="w-4 h-4" />
                  Download Full Audit Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GDPR Requests */}
          <TabsContent value="gdpr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GDPR Requests</CardTitle>
                <CardDescription>Right to be forgotten, data access, consent withdrawal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.filter(l => l.action === 'gdpr_request').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No GDPR requests in this period.</p>
                  ) : (
                    logs
                      .filter(l => l.action === 'gdpr_request')
                      .map((log, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm">GDPR Request</p>
                                <Badge variant="outline">{log.notes}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Logged by {log.user_email} on{' '}
                                {new Date(log.created_date).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}