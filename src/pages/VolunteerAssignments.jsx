import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSecureData from '@/hooks/useSecureData';
import DataFetchError from '@/components/DataFetchError';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Mail, Check } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  invited: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  attended: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800'
};

export default function VolunteerAssignments() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [formData, setFormData] = useState({ status: 'invited' });

  const queryClient = useQueryClient();
  const { campaignId } = useCampaign();

  const { data: events = [], error: eventError, refetch: refetchEvents } = useSecureData(
    'getActivityFeed',
    { campaign_id: campaignId },
    { staleTime: 180000, refetchInterval: 180000 }
  );

  const { data: volunteers = [] } = useSecureData(
    'getActivityFeed',
    { campaign_id: campaignId },
    { staleTime: 180000, refetchInterval: 180000 }
  );

  const { data: contacts = [], error: contactError, refetch: refetchContacts } = useSecureData(
    'getContactDetails',
    { campaign_id: campaignId },
    { staleTime: 120000, refetchInterval: 120000 }
  );

  const volunteerContacts = contacts.filter(c => c.volunteer);

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.EventVolunteer.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => {
      setFormData({ status: 'invited' });
      setShowAssignForm(false);
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EventVolunteer.update(id, data),
    onSuccess: () => {},
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id) => base44.entities.EventVolunteer.delete(id),
    onSuccess: () => {},
  });

  const handleAssignVolunteer = () => {
    if (selectedEvent && formData.volunteer_name && formData.volunteer_email) {
      createAssignmentMutation.mutate({
        event_id: selectedEvent.id,
        volunteer_name: formData.volunteer_name,
        volunteer_email: formData.volunteer_email,
        status: formData.status,
        role: formData.role || '',
        reminder_sent: false,
      });
    }
  };

  const eventVolunteers = selectedEvent
    ? volunteers.filter(v => v.event_id === selectedEvent.id)
    : [];

  const upcomingEvents = events.filter(e => e.status === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date));

  const dataError = eventError || contactError;

  return (
    <div className="space-y-6 p-6">
      {dataError && (
        <DataFetchError 
          error={dataError} 
          onRetry={() => {
            refetchEvents();
            refetchContacts();
          }}
          title="Unable to Load Volunteer Data" 
        />
      )}
      <h1 className="text-3xl font-bold font-heading text-foreground">Volunteer Assignments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => {
                  const eventVolCount = volunteers.filter(v => v.event_id === event.id).length;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        selectedEvent?.id === event.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="font-semibold text-sm">{event.title}</div>
                      <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM d, yyyy')}</p>
                      {event.time && <p className="text-xs text-muted-foreground">{event.time}</p>}
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">{eventVolCount} volunteer{eventVolCount !== 1 ? 's' : ''}</Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Volunteers for Selected Event */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEvent ? (
            <>
              <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle>{selectedEvent.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(selectedEvent.date), 'MMMM d, yyyy')} at {selectedEvent.time}
                    </p>
                    {selectedEvent.location && <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>}
                  </div>
                  <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Assign Volunteer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Volunteer - {selectedEvent.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Volunteer</label>
                          <Select 
                            value={formData.volunteer_name || ''} 
                            onValueChange={(vol) => {
                              const selected = volunteerContacts.find(c => c.name === vol);
                              setFormData({
                                ...formData, 
                                volunteer_name: vol,
                                volunteer_email: selected?.email || ''
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select volunteer" />
                            </SelectTrigger>
                            <SelectContent>
                              {volunteerContacts.map(v => (
                                <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <Input
                            placeholder="e.g. Team Lead, Leaflet Distributor"
                            value={formData.role || ''}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="invited">Invited</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="attended">Attended</SelectItem>
                              <SelectItem value="declined">Declined</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowAssignForm(false)}>Cancel</Button>
                          <Button onClick={handleAssignVolunteer}>Assign</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assigned Volunteers ({eventVolunteers.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {eventVolunteers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No volunteers assigned yet</p>
                  ) : (
                    eventVolunteers.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{assignment.volunteer_name}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.volunteer_email}</p>
                            {assignment.role && <p className="text-sm mt-1">{assignment.role}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Badge className={STATUS_COLORS[assignment.status]}>{assignment.status}</Badge>
                          {assignment.reminder_sent && (
                            <Badge variant="outline" className="flex gap-1">
                              <Mail className="w-3 h-3" /> Reminder sent
                            </Badge>
                          )}
                          {!assignment.reminder_sent && assignment.status === 'invited' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateAssignmentMutation.mutate({
                                id: assignment.id, 
                                data: { reminder_sent: true }
                              })}
                              className="gap-1"
                            >
                              <Mail className="w-3 h-3" /> Send Reminder
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-6 text-center text-muted-foreground h-full flex items-center justify-center">
              Select an event to view or assign volunteers
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}