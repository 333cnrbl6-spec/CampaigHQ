import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Clock } from 'lucide-react';

const PLACEHOLDERS = [
  { code: '{{name}}', label: 'Full name' },
  { code: '{{postcode}}', label: 'Postcode' },
  { code: '{{address}}', label: 'Address' },
  { code: '{{support_level}}', label: 'Support level' },
];

export default function SequenceBuilder({ sequence, onChange }) {
  const [messages, setMessages] = useState(sequence.messages || []);

  const addMessage = () => {
    setMessages([...messages, { delay_hours: 0, subject: '', body: '', order: messages.length }]);
  };

  const updateMessage = (idx, field, value) => {
    const updated = [...messages];
    updated[idx][field] = value;
    setMessages(updated);
    onChange({ ...sequence, messages: updated });
  };

  const removeMessage = (idx) => {
    const updated = messages.filter((_, i) => i !== idx);
    setMessages(updated);
    onChange({ ...sequence, messages: updated });
  };

  const insertPlaceholder = (idx, placeholder) => {
    const msg = messages[idx];
    const textarea = document.querySelector(`textarea[data-message-idx="${idx}"]`);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = msg.body.substring(0, start) + placeholder + msg.body.substring(end);
      updateMessage(idx, 'body', newBody);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Sequence Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sequence name</label>
            <Input
              value={sequence.name}
              onChange={(e) => onChange({ ...sequence, name: e.target.value })}
              placeholder="e.g., Welcome Strong Supporters"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={sequence.description || ''}
              onChange={(e) => onChange({ ...sequence, description: e.target.value })}
              placeholder="What does this sequence do?"
              className="mt-1 h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Trigger event</label>
              <Select value={sequence.trigger_event} onValueChange={(val) => onChange({ ...sequence, trigger_event: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_level_changed">Support level changed</SelectItem>
                  <SelectItem value="contact_created">New contact added</SelectItem>
                  <SelectItem value="canvassed_status_changed">Canvassed status changed</SelectItem>
                  <SelectItem value="volunteer_status_changed">Volunteer status changed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sequence.trigger_event === 'support_level_changed' && (
              <div>
                <label className="text-sm font-medium">Trigger when support is</label>
                <Select value={sequence.trigger_value} onValueChange={(val) => onChange({ ...sequence, trigger_value: val })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong_supporter">Strong Supporter</SelectItem>
                    <SelectItem value="leaning">Leaning</SelectItem>
                    <SelectItem value="undecided">Undecided</SelectItem>
                    <SelectItem value="opposed">Opposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Message Sequence</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Create a series of messages to send over time</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Message {idx + 1}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <Input
                      type="number"
                      value={msg.delay_hours}
                      onChange={(e) => updateMessage(idx, 'delay_hours', parseInt(e.target.value))}
                      min="0"
                      className="w-16 h-8 text-xs"
                    />
                    <span>hours delay</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMessage(idx)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {sequence.channel === 'email' && (
                <div>
                  <label className="text-xs font-medium">Subject line</label>
                  <Input
                    value={msg.subject}
                    onChange={(e) => updateMessage(idx, 'subject', e.target.value)}
                    placeholder="E.g., Thank you for your support!"
                    className="mt-1 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium">Message body</label>
                <Textarea
                  value={msg.body}
                  onChange={(e) => updateMessage(idx, 'body', e.target.value)}
                  data-message-idx={idx}
                  placeholder="Write your message here..."
                  className="mt-1 min-h-24 text-sm"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {PLACEHOLDERS.map(p => (
                    <Button
                      key={p.code}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => insertPlaceholder(idx, p.code)}
                    >
                      {p.code}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Button onClick={addMessage} variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add message to sequence
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}