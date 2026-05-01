import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock } from 'lucide-react';

const SUPPORT_LEVELS = ['strong_supporter', 'leaning', 'undecided', 'opposed'];
const TRIGGER_EVENTS = [
  { value: 'support_level_changed', label: 'Support level changes to...' },
  { value: 'contact_created', label: 'New contact added' },
  { value: 'canvassed_status_changed', label: 'Contact marked as canvassed' },
];

export default function SequenceWizard({ sequence, onChange }) {
  const [currentMessage, setCurrentMessage] = useState({
    order: sequence.messages.length + 1,
    delay_hours: 0,
    subject: '',
    body: '',
  });

  const handleAddMessage = () => {
    if (!currentMessage.body.trim()) return;
    
    const updated = {
      ...sequence,
      messages: [...sequence.messages, { ...currentMessage }],
    };
    onChange(updated);
    setCurrentMessage({
      order: sequence.messages.length + 2,
      delay_hours: 0,
      subject: '',
      body: '',
    });
  };

  const handleRemoveMessage = (idx) => {
    const updated = {
      ...sequence,
      messages: sequence.messages.filter((_, i) => i !== idx),
    };
    onChange(updated);
  };

  const handleChange = (field, value) => {
    onChange({ ...sequence, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sequence Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sequence Name</label>
            <Input
              value={sequence.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Thank You Strong Supporters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={sequence.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What is this sequence for?"
              className="h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trigger & Channel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trigger & Channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">When...</label>
              <Select value={sequence.trigger_event} onValueChange={(v) => handleChange('trigger_event', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sequence.trigger_event === 'support_level_changed' && (
              <div>
                <label className="block text-sm font-medium mb-2">Support Level</label>
                <Select value={sequence.trigger_value} onValueChange={(v) => handleChange('trigger_value', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Send Via</label>
              <Select value={sequence.channel} onValueChange={(v) => handleChange('channel', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="sms">💬 SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Messages */}
          {sequence.messages.length > 0 && (
            <div className="space-y-3">
              {sequence.messages.map((msg, idx) => (
                <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Message {idx + 1}</span>
                      <Badge variant="secondary" className="text-xs">Wait {msg.delay_hours}h</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleRemoveMessage(idx)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {msg.subject && <p className="text-xs font-medium text-muted-foreground">Subject: {msg.subject}</p>}
                  <p className="text-xs text-muted-foreground line-clamp-2">{msg.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Message Builder */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Add a new message</p>
            
            <div>
              <label className="block text-xs font-medium mb-1">Delay (hours)</label>
              <Input
                type="number"
                min="0"
                value={currentMessage.delay_hours}
                onChange={(e) => setCurrentMessage({ ...currentMessage, delay_hours: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>

            {sequence.channel === 'email' && (
              <div>
                <label className="block text-xs font-medium mb-1">Subject</label>
                <Input
                  value={currentMessage.subject}
                  onChange={(e) => setCurrentMessage({ ...currentMessage, subject: e.target.value })}
                  placeholder="e.g., Thank you for supporting {{name}}"
                  className="h-8 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Message Body</label>
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">Available placeholders: {'{'}}{'{'}name{'}'}{'}'}, {'{'}}{'{'}postcode{'}'}{'}'}, {'{'}}{'{'}support_level{'}'}{'}'}}</p>
              </div>
              <Textarea
                value={currentMessage.body}
                onChange={(e) => setCurrentMessage({ ...currentMessage, body: e.target.value })}
                placeholder={sequence.channel === 'email' 
                  ? "Dear {{name}},\n\nThank you for your support..." 
                  : "Hi {{name}}, thanks for your support!"}
                className="h-24 text-sm"
              />
            </div>

            <Button
              onClick={handleAddMessage}
              variant="outline"
              className="w-full gap-2"
              disabled={!currentMessage.body.trim()}
            >
              <Plus className="w-4 h-4" /> Add Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target Contacts (Optional Filters)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Only send if contact is...</label>
            <p className="text-xs text-muted-foreground mb-2">Leave empty to apply to all</p>
            <div className="space-y-2">
              {SUPPORT_LEVELS.map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sequence.filters?.support_level?.includes(level) || false}
                    onChange={(e) => {
                      const current = sequence.filters?.support_level || [];
                      const updated = e.target.checked
                        ? [...current, level]
                        : current.filter(l => l !== level);
                      handleChange('filters', { ...sequence.filters, support_level: updated });
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{level.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact must have...</label>
            <Select
              value={sequence.filters?.has_contact_method || 'any'}
              onValueChange={(v) => handleChange('filters', { ...sequence.filters, has_contact_method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any contact method</SelectItem>
                <SelectItem value="email">Email address</SelectItem>
                <SelectItem value="phone">Phone number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}