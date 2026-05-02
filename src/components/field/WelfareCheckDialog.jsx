import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function WelfareCheckDialog({ open, onOpenChange, onCheckIn }) {
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
            You've been canvassing for 20 minutes without a check-in.<br />
            Please confirm you're safe.
          </p>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onCheckIn}
          >
            ✓ I'm safe — check in
          </Button>
          <p className="text-xs text-muted-foreground">If you need help, call your team lead immediately.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}