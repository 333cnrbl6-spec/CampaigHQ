import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Calendar, MapPin, Clock, CheckCircle2, AlertCircle, 
  Loader2, Send, Eye, EyeOff, Trash2
} from 'lucide-react';

export default function RouteBatchAssignment({ turfId = null, contactIds = [] }) {
  const queryClient = useQueryClient();
  const [strategy, setStrategy] = useState('geospatial');
  const [contactsPerBatch, setContactsPerBatch] = useState(25);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatingBatches, setGeneratingBatches] = useState(false);
  const [batches, setBatches] = useState([]);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [assignmentStep, setAssignmentStep] = useState(null); // batch index being assigned
  const [assignVolunteerName, setAssignVolunteerName] = useState('');
  const [assignVolunteerEmail, setAssignVolunteerEmail] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => base44.entities.VolunteerProfile.list('full_name', 1000),
  });

  const assignBatchMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('assignRouteBatchToVolunteer', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setAssignmentStep(null);
      setAssignVolunteerName('');
      setAssignVolunteerEmail('');
      setAssignmentNotes('');
    },
  });

  const handleGenerateBatches = async () => {
    setGeneratingBatches(true);
    setBatches([]);
    try {
      const res = await base44.functions.invoke('generateDailyRouteBatches', {
        contact_ids: contactIds,
        turf_id: turfId,
        target_date: targetDate,
        contacts_per_batch: contactsPerBatch,
        strategy,
      });

      if (res.data?.success) {
        setBatches(res.data.batches);
      } else {
        alert(res.data?.error || 'Failed to generate batches');
      }
    } catch (err) {
      alert('Error generating batches: ' + err.message);
    } finally {
      setGeneratingBatches(false);
    }
  };

  const handleAssignBatch = async (batchIndex) => {
    if (!assignVolunteerEmail) {
      alert('Please select a volunteer');
      return;
    }

    const batch = batches[batchIndex];
    assignBatchMutation.mutate({
      volunteer_email: assignVolunteerEmail,
      volunteer_name: assignVolunteerName,
      contact_ids: batch.contact_ids,
      batch_number: batch.batch_number,
      target_date: batch.date,
      notes: assignmentNotes,
    });
  };

  const totalContacts = useMemo(() =>
    batches.reduce((sum, b) => sum + b.contact_count, 0),
    [batches]
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Settings panel */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Generate Route Batches
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Strategy</label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geospatial">Geospatial (TSP)</SelectItem>
                <SelectItem value="distance">Distance from Origin</SelectItem>
                <SelectItem value="balanced">Balanced (simple chunks)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How to group contacts</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Contacts per Batch</label>
            <Input
              type="number"
              min="10"
              max="50"
              value={contactsPerBatch}
              onChange={e => setContactsPerBatch(parseInt(e.target.value) || 25)}
            />
            <p className="text-xs text-muted-foreground">~2–3 hours per volunteer</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Date</label>
            <Input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">When to canvass</p>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleGenerateBatches}
              disabled={generatingBatches || (!contactIds.length && !turfId)}
              className="w-full gap-2"
            >
              {generatingBatches ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Generate Batches
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Batches list */}
      {batches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {batches.length} Batches · {totalContacts} Contacts
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatches([])}
            >
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {batches.map((batch, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 space-y-3">
                {/* Batch header */}
                <div
                  onClick={() => setExpandedBatch(expandedBatch === idx ? null : idx)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Badge className="text-base">#{batch.batch_number}</Badge>
                    <div className="space-y-0.5">
                      <p className="font-medium">{batch.contact_count} contacts</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{batch.estimated_time_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {batch.distance_km}km
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {batch.date}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedBatch(expandedBatch === idx ? null : idx)}
                  >
                    {expandedBatch === idx ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded view */}
                {expandedBatch === idx && (
                  <div className="space-y-4 pt-3 border-t border-border">
                    {/* Sample contacts */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sample Contacts</p>
                      {batch.sample_contacts.map((c, i) => (
                        <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.address}</p>
                        </div>
                      ))}
                    </div>

                    {/* Assignment UI */}
                    {assignmentStep === idx ? (
                      <div className="space-y-3 bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h3 className="font-medium text-sm">Assign to Volunteer</h3>

                        <div className="space-y-2">
                          <label className="text-xs font-medium">Volunteer *</label>
                          <Select value={assignVolunteerEmail} onValueChange={(val) => {
                            const v = volunteers.find(vv => vv.user_email === val);
                            setAssignVolunteerEmail(val);
                            setAssignVolunteerName(v?.full_name || '');
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select volunteer" />
                            </SelectTrigger>
                            <SelectContent>
                              {volunteers.map(v => (
                                <SelectItem key={v.user_email} value={v.user_email}>
                                  {v.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium">Notes (optional)</label>
                          <Input
                            placeholder="Any special instructions..."
                            value={assignmentNotes}
                            onChange={e => setAssignmentNotes(e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAssignmentStep(null);
                              setAssignVolunteerEmail('');
                              setAssignVolunteerName('');
                              setAssignmentNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAssignBatch(idx)}
                            disabled={!assignVolunteerEmail || assignBatchMutation.isPending}
                            className="gap-2 flex-1"
                          >
                            {assignBatchMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Assigning…
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Assign Batch
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setAssignmentStep(idx)}
                        className="w-full gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Assign to Volunteer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {batches.length === 0 && !generatingBatches && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 opacity-20 mx-auto mb-4" />
          <p>Select contacts and generate batches to assign to volunteers</p>
        </div>
      )}
    </div>
  );
}