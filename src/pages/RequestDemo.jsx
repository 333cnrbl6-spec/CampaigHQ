import { useState } from 'react';
import { Megaphone, CheckCircle, ArrowRight, Users, MapPin, BarChart3, Shield, Globe, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const PARTIES = [
  { value: 'green', label: 'Green Party', color: '#00612B' },
  { value: 'labour', label: 'Labour Party', color: '#E4003B' },
  { value: 'libdem', label: 'Liberal Democrats', color: '#FAA61A' },
  { value: 'snp', label: 'SNP', color: '#FDF38E' },
  { value: 'plaid', label: 'Plaid Cymru', color: '#3F8428' },
  { value: 'sdlp', label: 'SDLP', color: '#2E5F2E' },
  { value: 'alliance', label: 'Alliance Party', color: '#F6CB2F' },
  { value: 'other', label: 'Other / Independent', color: '#6B7280' },
];

const TIERS = [
  {
    name: 'Local Campaign',
    price: '£49',
    period: '/month',
    desc: 'One ward or constituency',
    features: ['Up to 5,000 contacts', '10 volunteers', 'Canvassing & leaflet tools', 'Basic reporting'],
    highlight: false,
  },
  {
    name: 'Regional',
    price: '£199',
    period: '/month',
    desc: 'Multiple constituencies',
    features: ['Up to 50,000 contacts', 'Unlimited volunteers', 'National dashboard', 'Advanced analytics', 'Priority support'],
    highlight: true,
  },
  {
    name: 'National Party',
    price: 'Custom',
    period: '',
    desc: 'Full party licence',
    features: ['Unlimited campaigns & contacts', 'White-label option', 'Dedicated onboarding', 'SLA & compliance package', 'Custom integrations'],
    highlight: false,
  },
];

const FEATURES = [
  { icon: MapPin, title: 'Turf & Canvassing', desc: 'Drag-and-drop turf management, live volunteer tracking, and door-knock logging — all on mobile.' },
  { icon: Users, title: 'Volunteer Management', desc: 'Shift scheduling, welfare checks, gamified leaderboards, and full profile management.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards showing support levels, canvassing coverage, and route efficiency.' },
  { icon: Shield, title: 'GDPR Compliant', desc: 'Built-in consent management, audit logs, right-to-be-forgotten, and data retention policies.' },
  { icon: Globe, title: 'Multi-party Ready', desc: 'Each party\'s data is fully isolated. White-label branding available per licence.' },
  { icon: Zap, title: 'Outreach Automation', desc: 'Automated email/SMS sequences, voter targeting, and post-election follow-up tools.' },
];

export default function RequestDemo() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', party: '', role: '', tier: '', phone: '', message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.party) return;
    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'demo@campaignhq.co.uk',
        subject: `Demo Request — ${form.party} — ${form.name}`,
        body: `
New demo request from Campaign HQ website:

Name: ${form.name}
Email: ${form.email}
Phone: ${form.phone}
Party: ${form.party}
Role: ${form.role}
Tier interest: ${form.tier}

Message:
${form.message}
        `.trim(),
      });
    } catch (_) {
      // best effort — still show success
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Nav */}
      <header className="border-b border-border/60 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Campaign HQ</span>
          </a>
          <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View Pricing
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-6 text-white/90 text-sm font-medium">
            <Zap className="w-4 h-4 text-emerald-300" />
            Licensed to political parties across the UK
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
            Get a Personalised Demo
          </h1>
          <p className="text-white/75 text-xl leading-relaxed mb-8">
            See Campaign HQ configured for your party. We'll walk you through canvassing, volunteer management, and national coordination — all in your branding.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
            {['No commitment required', '30-minute session', 'Your questions answered', 'Pricing confirmed'].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-300" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Form */}
          <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-bold">Request Received!</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Thanks {form.name}. We'll be in touch within one business day to arrange your personalised demo.
                </p>
                <Button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', party: '', role: '', tier: '', phone: '', message: '' }); }} variant="outline" className="mt-4">
                  Submit another request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-1">Book your demo</h2>
                  <p className="text-muted-foreground text-sm">Fill in the details below and we'll get back to you within one business day.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email address *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@party.org.uk"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone (optional)</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+44 7700 000000"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your role</label>
                    <input
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      placeholder="e.g. Campaign Manager"
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Party / Organisation *</label>
                  <div className="relative">
                    <select
                      required
                      value={form.party}
                      onChange={e => setForm({ ...form, party: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none pr-10"
                    >
                      <option value="">Select your party...</option>
                      {PARTIES.map(p => (
                        <option key={p.value} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Scale of interest</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIERS.map(t => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setForm({ ...form, tier: t.name })}
                        className={`rounded-lg border py-2.5 px-3 text-xs font-medium transition-all ${form.tier === t.name ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background text-muted-foreground hover:border-primary/40'}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Anything specific you'd like to see?</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="e.g. We have 200 volunteers and are targeting 12 constituencies in 2027..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full rounded-xl py-3 text-base font-semibold">
                  {loading ? 'Sending...' : <>Request your demo <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your details will only be used to arrange your demo. No spam.
                </p>
              </form>
            )}
          </div>

          {/* Features & Pricing */}
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">Everything your party needs</h2>
              <div className="grid gap-4">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing summary */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4">Licensing tiers</h2>
              <div className="space-y-3">
                {TIERS.map(tier => (
                  <div key={tier.name} className={`rounded-xl border p-5 ${tier.highlight ? 'border-primary bg-primary/5' : 'border-border/60 bg-card'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{tier.name}</p>
                        <p className="text-xs text-muted-foreground">{tier.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-bold text-xl text-primary">{tier.price}</span>
                        <span className="text-xs text-muted-foreground">{tier.period}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                      {tier.features.map(f => (
                        <span key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">All plans include a 30-day free trial. Annual billing available with 2 months free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Megaphone className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-foreground">Campaign HQ</span>
        </div>
        <p>The political campaign management platform. Licensed to parties across the UK.</p>
      </footer>
    </div>
  );
}