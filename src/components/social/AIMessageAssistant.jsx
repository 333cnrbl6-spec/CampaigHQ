import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Copy, CheckCheck, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENTS = [
  { value: 'strong_supporter', label: 'Strong Supporters', desc: 'Already on our side — mobilise & energise them' },
  { value: 'leaning', label: 'Leaning Supporters', desc: 'Soft supporters who need reassurance' },
  { value: 'undecided', label: 'Undecided Voters', desc: 'Not yet made up their mind — persuade them' },
  { value: 'opposed', label: 'Opposed / Sceptical', desc: 'May disagree — acknowledge concerns, find common ground' },
  { value: 'volunteers', label: 'Volunteers & Activists', desc: 'Campaign team — motivate & coordinate' },
  { value: 'general', label: 'General Public', desc: 'Broad community message for all residents' },
];

const ISSUES = [
  'Roads & potholes', 'Green spaces & parks', 'Anti-social behaviour',
  'Bin collections', 'Housing & planning', 'Local transport', 'Youth facilities',
  'Health services', 'Cost of living', 'Climate & environment', 'Community safety',
  'Get Out The Vote / polling day',
];

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook (community post)' },
  { value: 'twitter', label: 'X / Twitter (≤280 chars)' },
  { value: 'instagram', label: 'Instagram (caption + hashtags)' },
  { value: 'nextdoor', label: 'Nextdoor (neighbourhood post)' },
  { value: 'email', label: 'Email / newsletter' },
  { value: 'doorstep', label: 'Doorstep talking points' },
  { value: 'leaflet', label: 'Leaflet / campaign literature' },
];

const TONES = [
  { value: 'warm', label: '😊 Warm & personal' },
  { value: 'urgent', label: '🔥 Urgent & energising' },
  { value: 'informative', label: '📋 Informative & factual' },
  { value: 'empathetic', label: '💬 Empathetic & listening' },
  { value: 'bold', label: '💪 Bold & decisive' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm" variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }}
      className="gap-1.5 h-8 text-xs"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

function TalkingPoints({ points }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 text-sm font-semibold hover:bg-muted/60 transition-colors"
      >
        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Suggested Talking Points</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <ul className="bg-card px-4 py-3 space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-bold flex-shrink-0 mt-0.5">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AIMessageAssistant() {
  const [segment, setSegment] = useState('');
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('warm');
  const [extraContext, setExtraContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleIssue = (issue) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const canGenerate = segment && selectedIssues.length > 0 && platform;

  const generate = async (refine = false) => {
    setLoading(true);
    if (!refine) setResult(null);

    const segmentLabel = SEGMENTS.find(s => s.value === segment)?.label || segment;
    const platformLabel = PLATFORMS.find(p => p.value === platform)?.label || platform;
    const toneLabel = TONES.find(t => t.value === tone)?.label || tone;

    const prompt = `You are a UK local election campaign assistant for Paul Binns, Green Party candidate for Tyldesley & Mosley Common ward in Wigan, Greater Manchester.

Generate campaign messaging with the following brief:

TARGET VOTER SEGMENT: ${segmentLabel}
PLATFORM / FORMAT: ${platformLabel}
TONE: ${toneLabel}
KEY ISSUES TO ADDRESS: ${selectedIssues.join(', ')}
${extraContext ? `ADDITIONAL CONTEXT FROM USER: ${extraContext}` : ''}
${refine && result ? `PREVIOUS DRAFT TO REFINE:\n${result.draft}` : ''}

Please return a JSON object with:
1. "draft" - A ready-to-use message perfectly formatted for the platform (correct length, style, emojis where appropriate, hashtags if relevant). For doorstep talking points, use a bullet list. For Twitter, keep to ≤280 characters.
2. "talking_points" - Array of 4-5 concise bullet-point talking points tailored to this segment and issue set
3. "tip" - One short strategic tip (1-2 sentences) about reaching this specific voter segment effectively

Make the content authentic, locally-specific (mention Tyldesley, Mosley Common, the ward, local concerns), and persuasive without being pushy. Paul's values: community, green spaces, transparency, accountability.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          draft: { type: 'string' },
          talking_points: { type: 'array', items: { type: 'string' } },
          tip: { type: 'string' },
        },
      },
    });

    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">AI Campaign Message Assistant</p>
          <p className="text-sm text-muted-foreground mt-0.5">Tell the AI who you're targeting, what issue matters, and where you're posting — it will draft tailored copy and talking points instantly.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── LEFT: Controls ── */}
        <div className="space-y-5">

          {/* Voter segment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">1. Voter Segment</label>
            <div className="grid gap-2">
              {SEGMENTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    segment === s.value
                      ? 'border-primary bg-primary/8 text-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="font-medium text-foreground">{s.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">2. Key Issues <span className="text-muted-foreground font-normal">(select 1–3)</span></label>
            <div className="flex flex-wrap gap-2">
              {ISSUES.map(issue => (
                <button
                  key={issue}
                  onClick={() => toggleIssue(issue)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    selectedIssues.includes(issue)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          {/* Platform & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">3. Platform / Format</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Choose platform…" /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">4. Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Extra context */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">5. Extra Context <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea
              placeholder="e.g. 'Mention the new planning application on Church Road' or 'Reference our canvass last Saturday'"
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <Button
            className="w-full gap-2"
            disabled={!canGenerate || loading}
            onClick={() => generate(false)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating…' : 'Generate Message'}
          </Button>
        </div>

        {/* ── RIGHT: Output ── */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-20 text-center gap-3 text-muted-foreground">
              <Sparkles className="w-8 h-8 opacity-30" />
              <p className="text-sm">Set your brief on the left and click<br /><strong>Generate Message</strong> to get AI-drafted copy</p>
            </div>
          )}

          {loading && (
            <div className="border border-border rounded-xl flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground bg-muted/20">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm">Drafting your message…</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Draft */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Draft
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="ghost" className="gap-1.5 h-8 text-xs"
                      onClick={() => generate(true)}
                      disabled={loading}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refine
                    </Button>
                    <CopyButton text={result.draft} />
                  </div>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground bg-muted/30 rounded-lg p-3 min-h-[100px]">
                  {result.draft}
                </pre>
                {platform === 'twitter' && (
                  <p className={`text-xs ${result.draft.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {result.draft.length} / 280 characters
                  </p>
                )}
              </div>

              {/* Talking Points */}
              {result.talking_points?.length > 0 && (
                <TalkingPoints points={result.talking_points} />
              )}

              {/* Strategy tip */}
              {result.tip && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm">
                  <span className="text-amber-600 flex-shrink-0 mt-0.5">💡</span>
                  <p className="text-amber-800">{result.tip}</p>
                </div>
              )}

              {/* Segment badge */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{SEGMENTS.find(s => s.value === segment)?.label}</Badge>
                {selectedIssues.map(i => <Badge key={i} variant="outline" className="text-xs">{i}</Badge>)}
                <Badge variant="outline" className="text-xs">{PLATFORMS.find(p => p.value === platform)?.label}</Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}