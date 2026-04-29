import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Copy, CheckCheck, ChevronDown, ChevronUp, MessageSquare, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Section = ({ icon: Icon, title, color, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Icon className={`w-4 h-4 ${color}`} />
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  );
};

export default function ScriptDisplay({ script, contact, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const fullScriptText = [
    `CANVASSING SCRIPT FOR: ${contact.name}`,
    '',
    '=== OPENING ===',
    script.opening,
    '',
    '=== TALKING POINTS ===',
    ...(script.talking_points || []).map((p, i) => `${i + 1}. ${p}`),
    '',
    '=== FOLLOW-UP QUESTIONS ===',
    ...(script.follow_up_questions || []).map((q, i) => `${i + 1}. ${q}`),
    '',
    '=== HANDLING OBJECTIONS ===',
    ...(script.objection_handlers || []).map(o => `If they say "${o.objection}": ${o.response}`),
    '',
    '=== CLOSING ===',
    script.closing,
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScriptText);
    setCopied(true);
    toast.success('Script copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg">Script for {contact.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {script.tone && <Badge variant="outline" className="text-xs capitalize">{script.tone} tone</Badge>}
            {script.strategy && <Badge variant="secondary" className="text-xs">{script.strategy}</Badge>}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Opening */}
        <Section icon={MessageSquare} title="Opening Line" color="text-primary" defaultOpen={true}>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm leading-relaxed italic">
            "{script.opening}"
          </div>
        </Section>

        {/* Talking Points */}
        {script.talking_points?.length > 0 && (
          <Section icon={Lightbulb} title="Talking Points" color="text-amber-600" defaultOpen={true}>
            <ul className="space-y-2">
              {script.talking_points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Follow-up Questions */}
        {script.follow_up_questions?.length > 0 && (
          <Section icon={HelpCircle} title="Follow-up Questions" color="text-blue-600" defaultOpen={true}>
            <ul className="space-y-2">
              {script.follow_up_questions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <span className="text-blue-500 font-bold flex-shrink-0">Q:</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Objection Handlers */}
        {script.objection_handlers?.length > 0 && (
          <Section icon={AlertCircle} title="Handling Objections" color="text-red-500" defaultOpen={false}>
            <div className="space-y-3">
              {script.objection_handlers.map((o, i) => (
                <div key={i} className="text-sm space-y-1">
                  <div className="flex gap-2">
                    <span className="text-red-500 font-semibold flex-shrink-0">If:</span>
                    <span className="italic text-muted-foreground">"{o.objection}"</span>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className="text-primary font-semibold flex-shrink-0">Say:</span>
                    <span>"{o.response}"</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Closing */}
        {script.closing && (
          <Section icon={MessageSquare} title="Closing" color="text-green-600" defaultOpen={true}>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm leading-relaxed italic">
              "{script.closing}"
            </div>
          </Section>
        )}

        {/* Tips */}
        {script.tips && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground border border-border">
            <span className="font-semibold">💡 Organiser tip: </span>{script.tips}
          </div>
        )}
      </CardContent>
    </Card>
  );
}