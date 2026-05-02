import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Calendar, Settings, Plus, Play, Pause } from 'lucide-react';
import { useState } from 'react';

export default function OutreachAutomation() {
  const [selectedSequence, setSelectedSequence] = useState(null);

  const sequences = [
    {
      id: 'seq-1',
      name: 'Welcome to Greens (New Supporters)',
      type: 'email',
      status: 'active',
      trigger: 'Supporter identified during canvassing',
      messages: 3,
      sent: 4200,
      openRate: 42,
      clickRate: 18,
      convertRate: 12,
      lastRun: '2026-05-01',
    },
    {
      id: 'seq-2',
      name: 'GOTV Weekend Reminder',
      type: 'sms',
      status: 'scheduled',
      trigger: 'Election day - 3 days before',
      messages: 2,
      sent: 0,
      openRate: null,
      clickRate: null,
      convertRate: null,
      scheduledFor: '2026-05-04',
    },
    {
      id: 'seq-3',
      name: 'Cost of Living Crisis - Undecided Voters',
      type: 'email',
      status: 'active',
      trigger: 'Support level = Undecided',
      messages: 4,
      sent: 1850,
      openRate: 38,
      clickRate: 15,
      convertRate: 8,
      lastRun: '2026-04-30',
    },
    {
      id: 'seq-4',
      name: 'Thank You (Post-Vote)',
      type: 'email',
      status: 'draft',
      trigger: 'Manual trigger post-election',
      messages: 1,
      sent: 0,
      openRate: null,
      clickRate: null,
      convertRate: null,
      lastRun: null,
    },
  ];

  const selectedData = selectedSequence
    ? sequences.find(s => s.id === selectedSequence)
    : null;

  const activeSequences = sequences.filter(s => s.status === 'active').length;
  const totalSent = sequences.reduce((sum, s) => sum + s.sent, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Sequences</p>
              <p className="text-3xl font-bold">{sequences.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Sequences</p>
              <p className="text-3xl font-bold">{activeSequences}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
              <p className="text-3xl font-bold">{(totalSent / 1000).toFixed(1)}k</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="space-y-3">
        {sequences.map(seq => (
          <Card
            key={seq.id}
            className={`cursor-pointer transition-all ${
              selectedSequence === seq.id
                ? 'border-primary ring-2 ring-primary/50'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedSequence(seq.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {seq.type === 'email' ? (
                      <Mail className="w-4 h-4 text-blue-600" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    )}
                    <h3 className="font-semibold">{seq.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{seq.trigger}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{seq.messages} messages</Badge>
                    <Badge
                      className={
                        seq.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : seq.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {seq.status}
                    </Badge>
                  </div>
                </div>

                {seq.sent > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium mb-1">{seq.sent.toLocaleString()} sent</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {seq.openRate && <p>📧 {seq.openRate}% open rate</p>}
                      {seq.convertRate && <p>✓ {seq.convertRate}% converted</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Sequence Detail */}
      {selectedData && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedData.name}</CardTitle>
                <CardDescription>{selectedData.trigger}</CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedData.status === 'active' ? (
                  <Button size="sm" variant="outline" className="gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" className="gap-2">
                    <Play className="w-4 h-4" />
                    Activate
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Performance Metrics */}
            {selectedData.sent > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-3">Performance</h4>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="text-xl font-bold">
                      {(selectedData.sent / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Open Rate</p>
                    <p className="text-xl font-bold">{selectedData.openRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Click Rate</p>
                    <p className="text-xl font-bold">{selectedData.clickRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="text-xl font-bold">{selectedData.convertRate}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <h4 className="font-semibold">Sequence Messages</h4>
              <div className="space-y-2 text-sm">
                {[1, 2, 3].map(i => (
                  i <= selectedData.messages && (
                    <div
                      key={i}
                      className="p-3 bg-muted rounded flex items-start justify-between"
                    >
                      <div>
                        <p className="font-medium">Message {i}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {i === 1 ? 'immediately' : `${i * 3} days later`}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        Edit
                      </Button>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* GDPR Compliance */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm">
                <span className="font-semibold text-green-700">✓ GDPR Compliant</span>
                <br />
                <span className="text-green-600 text-xs">
                  All recipients have opted in. Unsubscribe links included. Audit trail
                  maintained.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GDPR & Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Campaign Tracking & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All outreach is tracked to ensure GDPR compliance:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Explicit consent tracking per contact</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Unsubscribe mechanism on all messages</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Right-to-be-forgotten automation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              <span>Complete audit trail for all processing</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}