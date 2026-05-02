import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ShiftManagement() {
  const queryClient = useQueryClient();
  const { campaign } = useCampaign();
  const [showDialog, setShowDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    team_lead: '',
    capacity: 10,
    description: '',
    contacts_count: 0,
    materials_needed: [],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['canvassing_shifts', campaign?.id],
    queryFn: () => base44.entities.CanvassingShift.filter({ campaign_id: campaign?.id }, '-date', 100),
  });

  const { data: signups = [] } = useQuery({
    queryKey: ['shift_signups', campaign?.id],
    queryFn: () => base44.entities.ShiftSignup.filter({ campaign_id: campaign?.id }, '-signed_up_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CanvassingShift.create({ ...data, campaign_id: campaign?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvassing_shifts', campaign?.id] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CanvassingShift.update(editingShift.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvassing_shifts', campaign?.id] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CanvassingShift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvassing_shifts', campaign?.id] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      team_lead: '',
      capacity: 10,
      description: '',
      contacts_count: 0,
      materials_needed: [],
    });
    setEditingShift(null);
    setShowDialog(false);
  };

  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
      alert('Please fill in required fields');
      return;
    }

    if (editingShift) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setFormData(shift);
    setShowDialog(true);
  };

  const getSignupCount = (shiftId) => {
    return signups.filter(s => s.shift_id === shiftId && s.status !== 'cancelled').length;
  };

  const getShiftSignups = (shiftId) => {
    return signups.filter(s => s.shift_id === shiftId && s.status !== 'cancelled');
  };

  const upcomingShifts = shifts.filter(s => new Date(s.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastShifts = shifts.filter(s => new Date(s.date) < new Date()).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-2">Shift Management</h1>
          <p className="text-muted-foreground">Create and manage canvassing shifts for volunteers</p>
        </div>
        <Button onClick={() => { setEditingShift(null); setFormData({ title: '', date: '', start_time: '', end_time: '', location: '', team_lead: '', capacity: 10, description: '', contacts_count: 0, materials_needed: [] }); setShowDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Shift
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Shifts</p>
            <p className="text-3xl font-bold mt-2">{shifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Upcoming Shifts</p>
            <p className="text-3xl font-bold mt-2">{upcomingShifts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Signups</p>
            <p className="text-3xl font-bold mt-2">{signups.filter(s => s.status !== 'cancelled').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Shifts */}
      <div className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-4">Upcoming Shifts</h2>
        {upcomingShifts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-8">
              <p className="text-muted-foreground">No upcoming shifts. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingShifts.map(shift => {
              const signupCount = getSignupCount(shift.id);
              const isFull = signupCount >= shift.capacity;
              return (
                <Card key={shift.id} className={isFull ? 'border-orange-200 bg-orange-50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{shift.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{shift.date} • {shift.start_time}–{shift.end_time} • {shift.location}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(shift)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this shift?')) deleteMutation.mutate(shift.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs">Team Lead</p>
                        <p className="font-medium">{shift.team_lead || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Contacts to Canvas</p>
                        <p className="font-medium">{shift.contacts_count}</p>
                      </div>
                    </div>

                    {shift.description && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mb-4">{shift.description}</p>
                    )}

                    {/* Capacity bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{signupCount} / {shift.capacity} signed up</span>
                        </div>
                        {isFull && <Badge variant="destructive">Full</Badge>}
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min((signupCount / shift.capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Signups list */}
                    {getShiftSignups(shift.id).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Signed up volunteers:</p>
                        <div className="space-y-1">
                          {getShiftSignups(shift.id).slice(0, 5).map(signup => (
                            <div key={signup.id} className="text-xs flex items-center justify-between">
                              <span>{signup.volunteer_name}</span>
                              <Badge variant="outline" className="text-xs">{signup.status}</Badge>
                            </div>
                          ))}
                          {getShiftSignups(shift.id).length > 5 && (
                            <p className="text-xs text-muted-foreground">+{getShiftSignups(shift.id).length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Shifts */}
      {pastShifts.length > 0 && (
        <div>
          <h2 className="font-heading text-xl font-bold mb-4">Past Shifts</h2>
          <div className="space-y-3">
            {pastShifts.map(shift => (
              <Card key={shift.id} className="opacity-75">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{shift.title}</p>
                    <p className="text-sm text-muted-foreground">{shift.date} • {getSignupCount(shift.id)} volunteers</p>
                  </div>
                  <Badge variant="secondary">{shift.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Shift title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., North Tyldesley - Evening"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start time *</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End time *</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Location *</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Town Hall"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Volunteer capacity</label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Team lead</label>
                <Input
                  value={formData.team_lead}
                  onChange={(e) => setFormData({ ...formData, team_lead: e.target.value })}
                  placeholder="Name or email"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Households to canvas</label>
                <Input
                  type="number"
                  value={formData.contacts_count}
                  onChange={(e) => setFormData({ ...formData, contacts_count: parseInt(e.target.value) })}
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Shift details, objectives, or special instructions"
                className="mt-1 min-h-20"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingShift ? 'Update Shift' : 'Create Shift'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}