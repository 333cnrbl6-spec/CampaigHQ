import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, ArrowLeft, ShieldCheck, User, Phone, Calendar, AlertCircle, FileText } from 'lucide-react';

/**
 * PrePrintBriefing — shown before any print sheet is generated.
 * Props:
 *   mode: 'canvassing' | 'leaflet'
 *   defaultTitle: string
 *   contactCount: number      (for canvassing)
 *   streetCount: number       (for leaflet)
 *   totalHouses: number       (for leaflet)
 *   onConfirm(briefing): void — called with the collected briefing data
 *   onBack(): void
 */
export default function PrePrintBriefing({
  mode = 'canvassing',
  defaultTitle = '',
  contactCount = 0,
  streetCount = 0,
  totalHouses = 0,
  onConfirm,
  onBack,
}) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    volunteer_name: '',
    distribution_date: today,
    leaflet_round: '1',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    access_notes: '',
    safety_confirmed: false,
    gdpr_confirmed: false,
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isValid =
    form.volunteer_name.trim() &&
    form.distribution_date &&
    form.emergency_contact_name.trim() &&
    form.emergency_contact_phone.trim() &&
    form.safety_confirmed &&
    form.gdpr_confirmed;

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1">
          <p className="text-sm font-semibold">{defaultTitle}</p>
          <p className="text-xs text-muted-foreground">
            {mode === 'canvassing'
              ? `${contactCount} contacts to canvass`
              : `${streetCount} streets · ${totalHouses} households`}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          disabled={!isValid}
          onClick={() => onConfirm(form)}
        >
          <Printer className="w-4 h-4" /> Generate Print Sheet
        </Button>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="font-heading text-2xl font-bold">Pre-Print Briefing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete this form before printing. The details will appear on your cover sheet and help keep volunteers safe.
          </p>
        </div>

        {/* Volunteer Details */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <User className="w-4 h-4" /> Volunteer Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vol_name">Volunteer Name <span className="text-destructive">*</span></Label>
              <Input
                id="vol_name"
                placeholder="Full name"
                value={form.volunteer_name}
                onChange={e => set('volunteer_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dist_date">Date of Distribution <span className="text-destructive">*</span></Label>
              <Input
                id="dist_date"
                type="date"
                value={form.distribution_date}
                onChange={e => set('distribution_date', e.target.value)}
              />
            </div>
          </div>
          {mode === 'leaflet' && (
            <div className="space-y-1.5 max-w-xs">
              <Label>Leaflet Round</Label>
              <Select value={form.leaflet_round} onValueChange={v => set('leaflet_round', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Round 1 — All Households</SelectItem>
                  <SelectItem value="2">Round 2 — Postal Voters Only</SelectItem>
                  <SelectItem value="3">Round 3 — Non-Postal Households</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </section>

        {/* Emergency Contact */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Phone className="w-4 h-4" /> Emergency Contact
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Required for lone worker safety. Who should we contact if we don't hear from you?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ec_name">Contact Name <span className="text-destructive">*</span></Label>
              <Input
                id="ec_name"
                placeholder="e.g. Sarah Smith"
                value={form.emergency_contact_name}
                onChange={e => set('emergency_contact_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec_phone">Contact Phone <span className="text-destructive">*</span></Label>
              <Input
                id="ec_phone"
                type="tel"
                placeholder="e.g. 07700 900000"
                value={form.emergency_contact_phone}
                onChange={e => set('emergency_contact_phone', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Health & Access */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <AlertCircle className="w-4 h-4" /> Health &amp; Accessibility Notes
          </h2>
          <p className="text-xs text-muted-foreground -mt-2">
            Optional — note any conditions, mobility needs, or areas to avoid that the organiser should be aware of.
          </p>
          <textarea
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            rows={3}
            placeholder="e.g. 'Cannot do stairs', 'Allergic to dogs', 'No more than 2 hours', etc."
            value={form.access_notes}
            onChange={e => set('access_notes', e.target.value)}
          />
        </section>

        {/* Safeguarding & GDPR confirmations */}
        <section className="bg-card border border-amber-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Safeguarding &amp; Data Confirmations
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <Checkbox
                id="safety_confirm"
                checked={form.safety_confirmed}
                onCheckedChange={v => set('safety_confirmed', !!v)}
                className="mt-0.5"
              />
              <Label htmlFor="safety_confirm" className="text-sm leading-relaxed cursor-pointer font-normal">
                <strong>Lone Worker Safety:</strong> I confirm I have told someone my planned route and expected return time.
                I understand I should call the campaign contact if I feel unsafe or have an incident.
                Campaign contact: <strong>07700 900000</strong> (or listed team lead).
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Checkbox
                id="gdpr_confirm"
                checked={form.gdpr_confirmed}
                onCheckedChange={v => set('gdpr_confirmed', !!v)}
                className="mt-0.5"
              />
              <Label htmlFor="gdpr_confirm" className="text-sm leading-relaxed cursor-pointer font-normal">
                <strong>Data Protection (GDPR):</strong> I confirm this sheet contains personal data and I will keep it
                secure, use it only for this campaign activity, and return or destroy it after use. I will not share,
                photograph, or retain this data beyond the session.
              </Label>
            </div>
          </div>
        </section>

        {/* Notes section */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <FileText className="w-4 h-4" /> Canvassing Tips
          </h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-none">
            <li>🟢 <strong>★★★</strong> = Strong Supporter — brief thanks &amp; remind to vote</li>
            <li>🟡 <strong>★★</strong> = Leaning — reinforce key messages, note any concerns</li>
            <li>🟠 <strong>★</strong> = Undecided — listen actively, identify key issues</li>
            <li>🔴 <strong>✗</strong> = Opposed — polite and brief, note any strong feedback</li>
            <li>⚪ <strong>?</strong> = Unknown — treat as undecided</li>
            <li className="pt-1">Always carry your ID badge. If anyone asks, explain you're a Green Party volunteer.</li>
            <li>Do not enter private land without permission. Respect "No Canvassing" signs.</li>
          </ul>
        </section>

        {/* Bottom confirm */}
        <div className="flex justify-end pt-2 pb-8">
          <Button
            size="lg"
            className="gap-2"
            disabled={!isValid}
            onClick={() => onConfirm(form)}
          >
            <Printer className="w-4 h-4" /> Generate Print Sheet
          </Button>
        </div>
      </div>
    </div>
  );
}