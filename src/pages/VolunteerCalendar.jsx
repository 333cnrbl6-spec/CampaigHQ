import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2 } from 'lucide-react';
import ShiftCalendar from '@/components/calendar/ShiftCalendar';
import ShiftCard from '@/components/calendar/ShiftCard';
import { addDays } from 'date-fns';

export default function VolunteerCalendar() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [signupNotes, setSignupNotes] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch user
  React.useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  // Fetch shifts
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['canvassing_shifts'],
    queryFn: () => base44.entities.CanvassingShift.list('-date', 100),
  });

  // Fetch signups
  const { data: signups = [] } = useQuery({
    queryKey: ['shift_signups'],
    queryFn: () => base44.entities.ShiftSignup.list('-signed_up_date', 500),
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftSignup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift_signups'] });
      setShowSignupDialog(false);
      setSignupNotes('');
      setSignupPhone('');
      setSelectedShift(null);
    },
  });

  // Cancel signup mutation
  const cancelSignupMutation = useMutation({
    mutationFn: (signupId) => base44.entities.ShiftSignup.delete(signupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift_signups'] });
    },
  });

  const handleSignUp = () => {
    if (!currentUser) {
      alert('Please log in to sign up for shifts');
      return;
    }

    signupMutation.mutate({
      shift_id: selectedShift.id,
      volunteer_email: currentUser.email,
      volunteer_name: currentUser.full_name,
      notes: signupNotes,
      phone: signupPhone,
      signed_up_date: new Date().toISOString(),
    });
  };

  const handleCancelSignup = (signupId) => {
    if (confirm('Cancel your signup for this shift?')) {
      cancelSignupMutation.mutate(signupId);
    }
  };

  // Helper functions
  const getSignupCount = (shiftId) => {
    return signups.filter(s => s.shift_id === shiftId && s.status !== 'cancelled').length;
  };

  const isUserSignedUp = (shiftId) => {
    return signups.find(s =>
      s.shift_id === shiftId &&
      s.volunteer_email === currentUser?.email &&
      s.status !== 'cancelled'
    );
  };

  const getUserSignupId = (shiftId) => {
    const signup = signups.find(s =>
      s.shift_id === shiftId &&
      s.volunteer_email === currentUser?.email &&
      s.status !== 'cancelled'
    );
    return signup?.id;
  };

  // Filter upcoming shifts
  const upcomingShifts = shifts
    .filter(s => new Date(s.date) >= new Date() && s.status === 'scheduled')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (shiftsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Volunteer Shifts Calendar</h1>
        <p className="text-muted-foreground">Browse and sign up for canvassing shifts in your area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <ShiftCalendar
            shifts={shifts.filter(s => s.status === 'scheduled')}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onShiftClick={(shift) => {
              setSelectedShift(shift);
              setShowSignupDialog(true);
            }}
          />
        </div>

        {/* Upcoming Shifts Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Shifts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingShifts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
              ) : (
                upcomingShifts.map(shift => (
                  <button
                    key={shift.id}
                    onClick={() => {
                      setSelectedShift(shift);
                      setShowSignupDialog(true);
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors space-y-1"
                  >
                    <p className="font-semibold text-sm">{shift.title}</p>
                    <p className="text-xs text-muted-foreground">{shift.date} at {shift.start_time}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{getSignupCount(shift.id)}/{shift.capacity}</span>
                      {isUserSignedUp(shift.id) && (
                        <span className="text-xs text-primary font-medium">✓ Signed up</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {currentUser.full_name}</p>
                <p><span className="text-muted-foreground">Email:</span> {currentUser.email}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign Up for Shift</DialogTitle>
          </DialogHeader>

          {selectedShift && (
            <div className="space-y-6">
              <ShiftCard
                shift={selectedShift}
                signupCount={getSignupCount(selectedShift.id)}
                isSignedUp={!!isUserSignedUp(selectedShift.id)}
                onSignUp={() => {}} // Handled separately
                onCancel={() => {
                  const signupId = getUserSignupId(selectedShift.id);
                  if (signupId) handleCancelSignup(signupId);
                }}
              />

              {!isUserSignedUp(selectedShift.id) && selectedShift.status === 'scheduled' && getSignupCount(selectedShift.id) < selectedShift.capacity && (
                <div className="space-y-4 border-t border-border pt-4">
                  <div>
                    <label className="text-sm font-medium">Phone number (for shift day contact)</label>
                    <Input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="Your phone number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes or questions</label>
                    <Textarea
                      value={signupNotes}
                      onChange={(e) => setSignupNotes(e.target.value)}
                      placeholder="Any questions about this shift?"
                      className="mt-1 min-h-20"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSignUp}
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Signing up...
                      </>
                    ) : (
                      'Confirm Signup'
                    )}
                  </Button>
                </div>
              )}

              {isUserSignedUp(selectedShift.id) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">✓ You're signed up for this shift</p>
                  <p className="text-xs text-green-600 mt-1">Check your email for shift details and reminders</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}