import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, GripVertical } from 'lucide-react';

const TRIGGER_EVENTS = [
  { value: 'contact_created', label: 'New Contact Added' },
  { value: 'canvassed_status_changed', label: 'Contact Canvassed' },
  { value: 'support_level_changed', label: 'Support Level Changed' },
];

const SUPPORT_LEVELS = [
  'strong_supporter',
  'leaning',
  'undecided',
  'opposed',
];

export default function SequenceBuilder({ sequence, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(sequence?.name || '');
  const [description, setDescription] = useState(sequence?.description || '');
  const [triggerEvent, setTriggerEvent] = useState(sequence?.trigger_event || 'contact_created');
  const [triggerValue, setTriggerValue] = useState(sequence?.trigger_value || '');
  const [channel, setChannel] = useState(sequence?.channel || 'email');
  const [messages, setMessages] = useState(sequence?.messages || []);
  const [status, setStatus] = useState(sequence?.status || 'active');

  const addMessage = () => {
    setMessages([
      ...messages,
      {
        order: messages.length,
        delay_hours: 0,
        subject: '',
        body: '',
      },
    ]);
  };

  const updateMessage = (idx, field, value) => {
    const updated = [...messages];
    updated[idx][field] = value;
    setMessages(updated);
  };

  const removeMessage = (idx) => {
    setMessages(messages.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim() || messages.length === 0) {
      alert('Please enter a sequence name and add at least one message');
      return;
    }

    onSave({
      name,
      description,
      trigger_event: triggerEvent,
      trigger_value: triggerValue,
      channel,
      messages: messages.map((m, idx) => ({ ...m, order: idx })),
      status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-background border-b">
          <div className="flex items-center justify-between">
            <CardTitle>{sequence ? 'Edit Sequence' : 'Create New Sequence'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sequence Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Thank You - Strong Supporters"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this sequence do?"
                className="mt-1"
              />
            </div>
          </div>

          {/* Trigger configuration */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm">When to trigger?</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Event</label>
                <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((evt) => (
                      <SelectItem key={evt.value} value={evt.value}>
                        {evt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {triggerEvent === 'support_level_changed' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Support Level</label>
                  <Select value={triggerValue} onValueChange={setTriggerValue}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Channel</label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Messages</h3>
              <Badge variant="secondary">{messages.length} message{messages.length !== 1 ? 's' : ''}</Badge>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Message {idx + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeMessage(idx)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Delay (hours)</label>
                  <Input
                    type="number"
                    min="0"
                    value={msg.delay_hours}
                    onChange={(e) => updateMessage(idx, 'delay_hours', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                {channel === 'email' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Subject</label>
                    <Input
                      value={msg.subject || ''}
                      onChange={(e) => updateMessage(idx, 'subject', e.target.value)}
                      placeholder="Email subject line"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Message Body</label>
                  <Textarea
                    value={msg.body}
                    onChange={(e) => updateMessage(idx, 'body', e.target.value)}
                    placeholder={`Message content. Use {{contact_name}}, {{volunteer_name}} for placeholders`}
                    className="mt-1 h-24"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addMessage}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Message
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? 'Saving...' : 'Save Sequence'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}