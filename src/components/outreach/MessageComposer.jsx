import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Sparkles, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TEMPLATES = {
  email: [
    {
      label: 'Event Invitation',
      subject: 'You\'re invited — Join us for {{event_name}}',
      body: `Dear {{name}},

I'd like to personally invite you to {{event_name}} on {{date}} at {{location}}.

This is a great opportunity to hear about our plans for Tyldesley & Mosley Common and to share your views on the issues that matter most to you.

I look forward to seeing you there.

Warm regards,
Paul Binns
Green Party Candidate — Tyldesley & Mosley Common`,
    },
    {
      label: 'Campaign Update',
      subject: 'A quick update from Paul Binns',
      body: `Dear {{name}},

Thank you for your continued support for our campaign in Tyldesley & Mosley Common.

I wanted to share a quick update on the issues we've been working on in your area.

[Add your update here]

If you'd like to get more involved, please reply to this email or visit our campaign page.

Best wishes,
Paul Binns
Green Party Candidate`,
    },
    {
      label: 'Canvassing Follow-up',
      subject: 'Great to meet you, {{name}}',
      body: `Dear {{name}},

It was wonderful speaking with you recently on the doorstep. Thank you for taking the time to share your thoughts.

As promised, I wanted to follow up about [issue discussed].

Please don't hesitate to get in touch if you have any questions.

Kind regards,
Paul Binns`,
    },
  ],
  sms: [
    {
      label: 'Event Reminder',
      body: 'Hi {{name}}, just a reminder about our event on {{date}} at {{location}}. Hope to see you there! — Paul Binns, Green Party',
    },
    {
      label: 'Voting Day',
      body: 'Hi {{name}}, today is polling day! Polls are open 7am–10pm. Every vote counts. — Paul Binns, Green Party Tyldesley & Mosley Common',
    },
    {
      label: 'Short Campaign Update',
      body: 'Hi {{name}}, a quick update from Paul Binns (Green Party). [Your message]. Reply STOP to opt out.',
    },
  ],
};

export default function MessageComposer({ channel, onChannelChange, subject, onSubjectChange, body, onBodyChange }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [generating, setGenerating] = useState(false);

  const applyTemplate = (tpl) => {
    if (tpl.subject) onSubjectChange(tpl.subject);
    onBodyChange(tpl.body);
    setShowTemplates(false);
  };

  const generateWithAI = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a ${channel === 'email' ? 'campaign email' : 'SMS message'} for a UK local council election candidate named Paul Binns running for the Green Party in Tyldesley & Mosley Common ward. 
The message should be warm, community-focused, and persuasive. 
${channel === 'email' ? 'Include a subject line on the first line prefixed with "Subject: ".' : 'Keep it under 160 characters.'}
Use {{name}} as a personalisation placeholder for the recipient's name.
Do not include any preamble - just write the message.`,
    });

    const text = typeof result === 'string' ? result : result?.text || '';
    if (channel === 'email') {
      const lines = text.split('\n');
      const subjectLine = lines.find(l => l.startsWith('Subject:'));
      if (subjectLine) {
        onSubjectChange(subjectLine.replace('Subject:', '').trim());
        onBodyChange(lines.filter(l => !l.startsWith('Subject:')).join('\n').trim());
      } else {
        onBodyChange(text);
      }
    } else {
      onBodyChange(text.trim().slice(0, 160));
    }
    setGenerating(false);
  };

  const charCount = body.length;
  const smsSegments = Math.ceil(charCount / 160);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">2. Compose Message</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <ChevronDown className="w-3 h-3" /> Templates
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={generateWithAI}
            disabled={generating}
          >
            <Sparkles className="w-3 h-3" />
            {generating ? 'Generating…' : 'AI Draft'}
          </Button>
        </div>
      </div>

      {/* Channel selector */}
      <div className="flex gap-2">
        <button
          onClick={() => onChannelChange('email')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            channel === 'email'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
          }`}
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          onClick={() => onChannelChange('sms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            channel === 'sms'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> SMS
        </button>
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-2">Select a template:</p>
          {TEMPLATES[channel].map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => applyTemplate(tpl)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-card transition-colors"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      )}

      {/* Subject (email only) */}
      {channel === 'email' && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Subject line</label>
          <Input
            value={subject}
            onChange={e => onSubjectChange(e.target.value)}
            placeholder="e.g. You're invited to our community meeting"
            className="text-sm"
          />
        </div>
      )}

      {/* Body */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Message body
          <span className="ml-1 text-primary/70">— use {'{{name}}'} for personalisation</span>
        </label>
        <Textarea
          value={body}
          onChange={e => onBodyChange(e.target.value)}
          placeholder={channel === 'email' ? 'Write your email here…' : 'Write your SMS here (max 160 chars)…'}
          rows={channel === 'email' ? 10 : 4}
          className="text-sm font-mono"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{charCount} characters</span>
          {channel === 'sms' && (
            <span>{smsSegments} SMS segment{smsSegments !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}