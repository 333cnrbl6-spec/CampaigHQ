import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle2, AlertCircle, Loader2, Mail, MessageSquare } from 'lucide-react';
import AudienceFilter from '../components/outreach/AudienceFilter';
import MessageComposer from '../components/outreach/MessageComposer';

const DEFAULT_FILTERS = { support: 'all', voter: 'all', postcode: 'all' };

function applyFilters(contacts, filters) {
  const { support, voter, postcode } = filters;
  return contacts.filter(c => {
    if (support !== 'all' && c.support_level !== support) return false;
    if (voter === 'registered' && !c.registered_voter) return false;
    if (voter === 'canvassed' && !c.canvassed) return false;
    if (voter === 'not_canvassed' && c.canvassed) return false;
    if (voter === 'volunteers' && !c.volunteer) return false;
    if (voter === 'has_email' && !c.email) return false;
    if (voter === 'has_phone' && !c.phone) return false;
    if (postcode !== 'all' && !(c.postcode || '').toUpperCase().startsWith(postcode)) return false;
    return true;
  });
}

export default function Outreach() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  });

  const audience = useMemo(() => applyFilters(contacts, filters), [contacts, filters]);

  const canSend = () => {
    if (sending) return false;
    if (!body.trim()) return false;
    if (channel === 'email' && !subject.trim()) return false;
    const eligible = channel === 'email'
      ? audience.filter(c => c.email)
      : audience.filter(c => c.phone);
    return eligible.length > 0;
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    if (channel === 'email') {
      const res = await base44.functions.invoke('sendBulkEmail', {
        contacts: audience,
        subject,
        body,
      });
      setResult({ channel: 'email', ...res.data });
    } else {
      // SMS: show info that Twilio integration is needed
      setResult({
        channel: 'sms',
        info: true,
        message: 'SMS sending requires a Twilio account. Please set up the Twilio integration to enable SMS delivery. Your message has been composed and saved.',
      });
    }

    setSending(false);
  };

  const emailCount = audience.filter(c => c.email).length;
  const phoneCount = audience.filter(c => c.phone).length;
  const eligibleCount = channel === 'email' ? emailCount : phoneCount;

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Bulk Outreach</h1>
        <p className="text-muted-foreground mt-1">Send personalised emails or SMS to filtered contact segments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audience */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
            <AudienceFilter
              contacts={contacts}
              filters={filters}
              onChange={setFilters}
            />
          </div>

          {/* Composer */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
            <MessageComposer
              channel={channel}
              onChannelChange={(c) => { setChannel(c); setResult(null); }}
              subject={subject}
              onSubjectChange={setSubject}
              body={body}
              onBodyChange={setBody}
            />
          </div>
        </div>

        {/* Right: Send panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-semibold">3. Review & Send</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Audience size</span>
                <span className="font-medium">{audience.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium flex items-center gap-1">
                  {channel === 'email' ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  {channel === 'email' ? 'Email' : 'SMS'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Deliverable to</span>
                <Badge variant="outline" className={eligibleCount === 0 ? 'text-destructive border-destructive/50' : 'text-primary border-primary/50'}>
                  {eligibleCount} {channel === 'email' ? 'emails' : 'phones'}
                </Badge>
              </div>
              {channel === 'email' && audience.length - emailCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ⚠ {audience.length - emailCount} contacts have no email and will be skipped.
                </p>
              )}
              {channel === 'sms' && audience.length - phoneCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ⚠ {audience.length - phoneCount} contacts have no phone and will be skipped.
                </p>
              )}
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleSend}
              disabled={!canSend()}
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send to {eligibleCount} {channel === 'email' ? 'email' : 'SMS'}{eligibleCount !== 1 ? 's' : ''}</>
              )}
            </Button>

            {result && (
              <div className={`rounded-xl p-4 text-sm space-y-1 ${result.error || result.info ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                {result.error ? (
                  <div className="flex items-start gap-2 text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{result.error}</span>
                  </div>
                ) : result.info ? (
                  <div className="flex items-start gap-2 text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{result.message}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Sent successfully!
                    </div>
                    <p className="text-green-600">✓ {result.results?.sent} emails delivered</p>
                    {result.results?.skipped > 0 && (
                      <p className="text-muted-foreground">{result.results.skipped} skipped (no email)</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Personalisation key */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Personalisation tags</p>
              {[['{{name}}', 'Contact\'s full name'], ['{{postcode}}', 'Their postcode'], ['{{address}}', 'Their address']].map(([tag, desc]) => (
                <div key={tag} className="flex items-center gap-2 text-xs">
                  <code className="bg-background px-1.5 py-0.5 rounded text-primary font-mono">{tag}</code>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}