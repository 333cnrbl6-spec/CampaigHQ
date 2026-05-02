import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, FileText, Settings, Users, CreditCard, Shield, Zap } from 'lucide-react';

export default function LaunchChecklist() {
  const [checklist, setChecklist] = useState([
    {
      id: 'campaign_setup',
      section: 'Campaign Setup',
      icon: Settings,
      items: [
        { id: 'basic_info', label: 'Campaign name & details', completed: false },
        { id: 'election_date', label: 'Election date & target votes', completed: false },
        { id: 'branding', label: 'Logo & brand colors', completed: false },
        { id: 'invite_code', label: 'Invite code generated', completed: false },
      ],
    },
    {
      id: 'team',
      section: 'Team & Permissions',
      icon: Users,
      items: [
        { id: 'team_members', label: 'Team members invited', completed: false },
        { id: 'roles_assigned', label: 'Roles & permissions set', completed: false },
        { id: 'team_lead', label: 'Team leads assigned', completed: false },
      ],
    },
    {
      id: 'data',
      section: 'Data & Contacts',
      icon: FileText,
      items: [
        { id: 'contacts_imported', label: 'Voter contacts imported', completed: false },
        { id: 'deduplication', label: 'Duplicates removed', completed: false },
        { id: 'turf_setup', label: 'Turfs & zones defined', completed: false },
        { id: 'geocoding', label: 'Addresses geocoded', completed: false },
      ],
    },
    {
      id: 'billing',
      section: 'Billing & Subscription',
      icon: CreditCard,
      items: [
        { id: 'plan_selected', label: 'Billing plan selected', completed: false },
        { id: 'payment_method', label: 'Payment method added', completed: false },
        { id: 'trial_setup', label: 'Trial period activated', completed: false },
      ],
    },
    {
      id: 'security',
      section: 'Security & Compliance',
      icon: Shield,
      items: [
        { id: 'gdpr_reviewed', label: 'GDPR policy reviewed', completed: false },
        { id: 'data_retention', label: 'Data retention policy set', completed: false },
        { id: 'audit_logging', label: 'Audit logging enabled', completed: false },
      ],
    },
    {
      id: 'launch',
      section: 'Launch Readiness',
      icon: Zap,
      items: [
        { id: 'mobile_tested', label: 'Mobile app tested', completed: false },
        { id: 'field_mode_trained', label: 'Team trained on field mode', completed: false },
        { id: 'support_prepared', label: 'Support contacts prepared', completed: false },
        { id: 'backup_ready', label: 'Data backup verified', completed: false },
      ],
    },
  ]);

  const toggleItem = (sectionId, itemId) => {
    setChecklist(checklist.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return section;
    }));
  };

  const totalItems = checklist.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = checklist.reduce((sum, s) => sum + s.items.filter(i => i.completed).length, 0);
  const progress = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Launch Checklist</h1>
          <p className="text-muted-foreground">Complete all items before going live with your campaign</p>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">{completedItems} of {totalItems} complete</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm font-semibold text-primary">{progress}% Complete</p>
            </div>
            {progress === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Ready to launch! 🎉</p>
                  <p className="text-sm text-green-700">All pre-launch requirements are complete.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {checklist.map(section => {
            const Icon = section.icon;
            const sectionProgress = Math.round(
              (section.items.filter(i => i.completed).length / section.items.length) * 100
            );

            return (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.section}</CardTitle>
                        <p className="text-sm text-muted-foreground">{section.items.filter(i => i.completed).length} of {section.items.length} complete</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{sectionProgress}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(section.id, item.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call-to-action */}
        {progress < 100 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Not ready yet?</p>
              <p className="text-sm text-amber-700 mt-1">
                Complete the remaining {totalItems - completedItems} items before launching your campaign.
              </p>
            </div>
          </div>
        )}

        {progress === 100 && (
          <Button className="w-full h-12 text-base gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Launch Campaign
          </Button>
        )}
      </div>
    </div>
  );
}