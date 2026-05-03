import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bell, Zap, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function GOTVSetup({ campaign, onSuccess }) {
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const setupMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const electionDate = new Date(campaign.election_date);
      const reminderTime = new Date(electionDate.getTime() - 48 * 60 * 60 * 1000);

      // Calculate cron for 48 hours before election at 9am (UK time)
      const day = reminderTime.getDate();
      const month = reminderTime.getMonth() + 1;
      const year = reminderTime.getFullYear();

      // Create scheduled automation
      const automation = await base44.functions.invoke('createScheduledAutomation', {
        automation_type: 'scheduled',
        name: `GOTV 48h Reminder - ${campaign.name}`,
        function_name: 'sendGOTVReminders',
        schedule_type: 'one-time',
        schedule_mode: 'one-time',
        one_time_date: reminderTime.toISOString(),
        function_args: {
          campaign_id: campaign.id,
        },
      });

      setAutomationEnabled(true);
      onSuccess?.();
      return automation;
    },
  });

  const handleEnable = () => {
    setupMutation.mutate();
  };

  const electionDate = new Date(campaign.election_date);
  const daysUntilElection = Math.ceil((electionDate - new Date()) / (1000 * 60 * 60 * 24));
  const reminderDate = new Date(electionDate.getTime() - 48 * 60 * 60 * 1000);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              GOTV 48-Hour Reminder Engine
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Automated email & SMS reminders 48 hours before election day
            </p>
          </div>
          <Badge variant={automationEnabled ? 'default' : 'outline'}>
            {automationEnabled ? '✓ Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Election Info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Election Date</p>
            <p className="font-semibold">{electionDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Days Away</p>
            <p className="font-semibold">{daysUntilElection} days</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Reminder Scheduled For</p>
            <p className="font-semibold text-sm">{reminderDate.toLocaleDateString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* What it does */}
        <div className="space-y-2">
          <p className="text-sm font-medium">What this automation does:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Bell className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
              <span>Sends personalized email reminders to all supporters & undecided voters</span>
            </li>
            <li className="flex gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
              <span>Triggers exactly 48 hours before election day</span>
            </li>
            <li className="flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
              <span>Includes polling station lookup link & voting tips</span>
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            This will send emails to all contacts with email addresses except those marked as "opposed". Make sure contact data is current before enabling.
          </p>
        </div>

        {/* Enable Button */}
        <Button
          onClick={handleEnable}
          disabled={automationEnabled || setupMutation.isPending}
          className="w-full"
        >
          {setupMutation.isPending ? 'Setting up...' : automationEnabled ? '✓ Automation Active' : 'Enable GOTV Reminders'}
        </Button>

        {automationEnabled && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ GOTV reminder automation is now scheduled. Volunteers will receive reminders 48 hours before election day.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}