import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WelfareCheckDialog({ open, onOpenChange, onCheckIn }) {
  const [teamLead, setTeamLead] = useState(null);

  useEffect(() => {
    if (!open) return;
    base44.auth.me().then(user => {
      if (!user?.email) return;
      base44.entities.VolunteerProfile.filter({ user_email: user.email }).then(profiles => {
        const profile = profiles?.[0];
        if (profile?.team_lead_email) {
          setTeamLead({ email: profile.team_lead_email });
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm mx-auto text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-amber-700">
            <ShieldAlert className="w-5 h-5" /> Welfare Check
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 space-y-4">
          <p className="text-sm text-muted-foreground">
            You've been out for 20 minutes without a check-in.<br />
            Please confirm you're safe.
          </p>
          <Button
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
            onClick={onCheckIn}
          >
            ✓ I'm safe — check in
          </Button>
          {teamLead?.email && (
            <a
              href={`mailto:${teamLead.email}`}
              className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Contact team lead
            </a>
          )}
          <p className="text-xs text-muted-foreground">
            If you feel unsafe, call 999 immediately, then notify your team lead.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}