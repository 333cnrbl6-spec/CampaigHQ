import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Plus, AlertCircle, Check } from 'lucide-react';
import { useState } from 'react';

export default function VolunteerShiftScheduling({ campaigns = [] }) {
  const [showNewShift, setShowNewShift] = useState(false);

  // Mock shift data
  const mockShifts = [
    {
      id: 'shift-1',
      campaignName: 'Tyldesley Green Party 2026',
      title: 'North Area Canvassing',
      date: '2026-05-10',
      time: '14:00-17:00',
      location: 'Market Street, Tyldesley',
      capacity: 8,
      signups: 5,
      status: 'open',
      skills: ['canvassing', 'leafleting'],
    },
    {
      id: 'shift-2',
      campaignName: 'Brighton Pavilion',
      title: 'Phone Banking Evening',
      date: '2026-05-11',
      time: '18:00-20:00',
      location: 'Virtual (Zoom)',
      capacity: 15,
      signups: 12,
      status: 'almost-full',
      skills: ['phone-banking'],
    },
    {
      id: 'shift-3',
      campaignName: 'Manchester Central',
      title: 'URGENT: Volunteer Surge',
      date: '2026-05-09',
      time: '10:00-17:00',
      location: 'Central Ward HQ',
      capacity: 20,
      signups: 8,
      status: 'urgent',
      skills: ['any'],
    },
  ];

  const urgentShifts = mockShifts.filter(s => s.status === 'urgent');
  const openShifts = mockShifts.filter(s => s.status === 'open' || s.status === 'almost-full');

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'almost-full': return 'bg-amber-50 border-amber-200';
      case 'open': return 'bg-green-50 border-green-200';
      default: return 'bg-muted border-border';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'urgent': return <Badge className="bg-red-600">URGENT</Badge>;
      case 'almost-full': return <Badge className="bg-amber-600">Almost Full</Badge>;
      case 'open': return <Badge className="bg-green-600">Open</Badge>;
      default: return <Badge>Scheduled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Shifts</p>
              <p className="text-3xl font-bold">{mockShifts.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
              <p className="text-3xl font-bold">{mockShifts.reduce((sum, s) => sum + s.signups, 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-700">Urgent Surges</p>
              <p className="text-3xl font-bold text-red-600">{urgentShifts.length}</p>
              <p className="text-xs text-red-600">Need volunteers NOW</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button onClick={() => setShowNewShift(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Create Shift
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Shifts */}
      {urgentShifts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Urgent Volunteer Surges
            </CardTitle>
            <CardDescription className="text-red-600">
              Campaigns needing immediate volunteer support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentShifts.map(shift => (
              <div key={shift.id} className="p-4 bg-white rounded-lg border-2 border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-red-700">{shift.title}</h4>
                    <p className="text-sm text-muted-foreground">{shift.campaignName}</p>
                  </div>
                  {getStatusBadge(shift.status)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(shift.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {shift.time}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {shift.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {shift.signups}/{shift.capacity} signed up
                  </div>
                </div>
                <Button className="w-full bg-red-600 hover:bg-red-700">Sign Up for Surge</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Open Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Shifts
          </CardTitle>
          <CardDescription>All campaigns across the party</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openShifts.map(shift => (
            <div key={shift.id} className={`p-4 rounded-lg border ${getStatusColor(shift.status)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{shift.title}</h4>
                  <p className="text-sm text-muted-foreground">{shift.campaignName}</p>
                </div>
                {getStatusBadge(shift.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(shift.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {shift.time}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {shift.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{shift.signups}/{shift.capacity}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">View Details</Button>
                <Button className="flex-1">Sign Up</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills Matching */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Campaign Volunteer Lending</CardTitle>
          <CardDescription>
            Help neighboring campaigns by volunteering your skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">
              Your skills: <span className="font-semibold">Canvassing, Data Entry, Team Leading</span>
            </p>
            <Button variant="outline" className="w-full">Find Shifts Matching Your Skills</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}