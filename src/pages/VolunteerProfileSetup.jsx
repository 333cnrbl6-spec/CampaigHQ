import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, User, Phone, ShieldAlert, MapPin, Info, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'intro',       title: 'Welcome',           icon: User },
  { id: 'personal',    title: 'Your Details',       icon: Phone },
  { id: 'emergency',   title: 'Emergency Contact',  icon: ShieldAlert },
  { id: 'location',    title: 'Location & Safety',  icon: MapPin },
  { id: 'availability',title: 'Availability',        icon: CheckCircle2 },
  { id: 'done',        title: 'All Set!',            icon: CheckCircle2 },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Evenings','Weekends'];
const AREAS = ['Tyldesley','Mosley Common','Astley','Leigh','Other'];

function InfoBox({ children }) {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function TogglePill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background border-border hover:border-primary/40'
      }`}
    >
      {label}
    </button>
  );
}

export default function VolunteerProfileSetup() {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    location_tracking_consent: false,
    gdpr_consent: false,
    availability: [],
    areas_preferred: [],
    has_vehicle: false,
    languages: [],
    langInput: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        if (u && u.email) {
          setUser(u);
          setForm(f => ({ ...f, full_name: u.full_name || '' }));
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };
    loadUser();
  }, []);

  // Check if profile already exists — with proper error handling
  const { data: profiles = [], isLoading: loadingProfile, error: profileError } = useQuery({
    queryKey: ['volunteer_profile_me', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.VolunteerProfile.filter({ user_email: user.email });
      } catch (err) {
        console.error('Error loading volunteer profile:', err);
        return [];
      }
    },
    enabled: !!user?.email,
  });
  const existingProfile = profiles?.[0];

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        return base44.entities.VolunteerProfile.update(existingProfile.id, data);
      }
      return base44.entities.VolunteerProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_profile_me', user?.email] });
      setStep(STEPS.length - 1);
    },
  });

  const toggle = (field, value) => {
    setForm(f => {
      const currentArray = Array.isArray(f[field]) ? f[field] : [];
      return {
        ...f,
        [field]: currentArray.includes(value)
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value],
      };
    });
  };

  const handleSave = () => {
    if (!user?.email) {
      console.error('User email missing');
      return;
    }
    const { langInput, ...rest } = form;
    saveMutation.mutate({
      ...rest,
      user_email: user.email,
      location_consent_date: form.location_tracking_consent ? new Date().toISOString().split('T')[0] : '',
      setup_complete: true,
    });
  };

  const canProceed = () => {
    if (step === 1) return form.full_name.trim() && form.phone.trim();
    if (step === 2) return form.emergency_contact_name.trim() && form.emergency_contact_phone.trim();
    if (step === 3) return form.gdpr_consent;
    return true;
  };

  if (loadingProfile) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Already complete — show summary
  if (existingProfile?.setup_complete && step === 0) {
    return <ProfileSummary profile={existingProfile} onEdit={() => setStep(1)} />;
  }

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const progressPct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-border rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{step + 1} of {STEPS.length}</span>
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <StepIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">{currentStep.title}</h1>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6 space-y-5">

            {/* INTRO */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Welcome to the <strong>Tyldesley & Mosley Common Campaign</strong>! 👋
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Before you head out canvassing, we need a few details. This takes about 2 minutes and ensures:
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    ['🛡️', 'Your safety', 'We know who to contact if anything goes wrong on the doorstep.'],
                    ['📍', 'Welfare tracking', 'Your team lead can see you\'re safe and out in the field.'],
                    ['🗺️', 'Turf assignment', 'We can allocate the right streets and routes to you.'],
                    ['📋', 'Paper trail', 'Records protect both you and the campaign legally.'],
                  ].map(([icon, title, desc]) => (
                    <li key={title} className="flex gap-3 bg-muted/40 rounded-lg p-3">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="font-medium text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <InfoBox>Your data is stored securely and used only for campaign coordination. You can request deletion at any time.</InfoBox>
              </div>
            )}

            {/* PERSONAL */}
            {step === 1 && (
              <div className="space-y-4">
                <InfoBox>We need your name and mobile number so your team lead can contact you on shift days and during welfare checks.</InfoBox>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Full name <span className="text-destructive">*</span></label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Jane Smith" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mobile number <span className="text-destructive">*</span></label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 07700 900123" type="tel" />
                  <p className="text-xs text-muted-foreground">Used only for campaign coordination — never shared externally.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Languages spoken</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.langInput}
                      onChange={e => setForm(f => ({ ...f, langInput: e.target.value }))}
                      placeholder="e.g. Urdu, Polish"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && form.langInput.trim()) {
                          setForm(f => ({ ...f, languages: [...f.languages, f.langInput.trim()], langInput: '' }));
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      if (form.langInput.trim()) setForm(f => ({ ...f, languages: [...f.languages, f.langInput.trim()], langInput: '' }));
                    }}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {form.languages.map(l => (
                      <Badge key={l} variant="secondary" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, languages: f.languages.filter(x => x !== l) }))}>
                        {l} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.has_vehicle} onChange={e => setForm(f => ({ ...f, has_vehicle: e.target.checked }))} className="w-4 h-4 rounded" />
                  <span className="text-sm">I have a car (useful for reaching remote streets)</span>
                </label>
              </div>
            )}

            {/* EMERGENCY CONTACT */}
            {step === 2 && (
              <div className="space-y-4">
                <InfoBox>
                  <strong>Why do we need this?</strong> Canvassing occasionally involves knocking doors in unfamiliar areas, sometimes alone or after dark. If a volunteer is unreachable during a welfare check, we need someone to call. This is standard practice for any volunteer organisation.
                </InfoBox>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Emergency contact name <span className="text-destructive">*</span></label>
                  <Input value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} placeholder="e.g. John Smith" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Their phone number <span className="text-destructive">*</span></label>
                  <Input value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} placeholder="e.g. 07700 900456" type="tel" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Relationship</label>
                  <Input value={form.emergency_contact_relation} onChange={e => setForm(f => ({ ...f, emergency_contact_relation: e.target.value }))} placeholder="e.g. Partner, Parent, Friend" />
                </div>
              </div>
            )}

            {/* LOCATION & GDPR */}
            {step === 3 && (
              <div className="space-y-4">
                <InfoBox>
                  <strong>Location sharing during canvassing</strong><br />
                  When you use the Field Mode app, your GPS position is sent to campaign HQ every 30 seconds. This lets us:
                  <ul className="mt-1 ml-3 list-disc space-y-0.5 text-xs">
                    <li>Know you're safe if we haven't heard from you</li>
                    <li>Show team leads where volunteers are in the field</li>
                    <li>Trigger a welfare alert if updates stop for 20+ minutes</li>
                  </ul>
                  <p className="mt-1 text-xs">Location data is only active during a field session and is not stored long-term.</p>
                </InfoBox>
                <label className="flex items-start gap-3 cursor-pointer bg-muted/40 rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={form.location_tracking_consent}
                    onChange={e => setForm(f => ({ ...f, location_tracking_consent: e.target.checked }))}
                    className="w-5 h-5 rounded mt-0.5"
                  />
                  <span className="text-sm">
                    I consent to my GPS location being shared with campaign HQ while I'm actively canvassing using the Field Mode app.
                  </span>
                </label>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Data processing consent <span className="text-destructive">*</span></p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your name, phone number, and emergency contact details will be stored securely and used only for the purpose of organising and running the campaign. Data will not be sold or shared with third parties. You have the right to request access to or deletion of your data at any time by contacting the campaign.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <input
                      type="checkbox"
                      checked={form.gdpr_consent}
                      onChange={e => setForm(f => ({ ...f, gdpr_consent: e.target.checked }))}
                      className="w-5 h-5 rounded mt-0.5"
                    />
                    <span className="text-sm font-medium">
                      I have read and agree to the campaign's data processing statement above. <span className="text-destructive">*</span>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* AVAILABILITY */}
            {step === 4 && (
              <div className="space-y-4">
                <InfoBox>This helps organisers assign you shifts and turfs that work around your schedule. You can update this any time.</InfoBox>
                <div>
                  <label className="text-sm font-medium mb-2 block">When are you generally available?</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <TogglePill key={day} label={day} selected={form.availability.includes(day)} onClick={() => toggle('availability', day)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Preferred areas</label>
                  <div className="flex flex-wrap gap-2">
                    {AREAS.map(area => (
                      <TogglePill key={area} label={area} selected={form.areas_preferred.includes(area)} onClick={() => toggle('areas_preferred', area)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DONE */}
            {step === STEPS.length - 1 && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-heading">You're all set!</h2>
                  <p className="text-sm text-muted-foreground mt-1">Your profile is saved and the campaign team can now assign you turfs and leaflet routes.</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-4 text-left space-y-2 text-sm">
                  <p><strong>What happens next:</strong></p>
                  <ul className="space-y-1 text-muted-foreground ml-3 list-disc">
                    <li>An organiser will assign you a turf or leaflet route</li>
                    <li>You'll see your assignment in <strong>Field Mode</strong></li>
                    <li>Your team lead can see your welfare status when you're active</li>
                    <li>You can update your profile any time from the menu</li>
                  </ul>
                </div>
                <Button className="w-full" onClick={() => window.location.href = '/field-mode'}>
                  Go to Field Mode →
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        {step < STEPS.length - 1 && (
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            {step < STEPS.length - 2 ? (
              <Button
                className="flex-1 gap-2"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                className="flex-1 gap-2"
                onClick={handleSave}
                disabled={!canProceed() || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save & Finish
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSummary({ profile, onEdit }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading">My Volunteer Profile</h1>
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Row label="Name" value={profile.full_name} />
            <Row label="Phone" value={profile.phone} />
            <Row label="Emergency contact" value={`${profile.emergency_contact_name} (${profile.emergency_contact_relation || 'contact'}) — ${profile.emergency_contact_phone}`} />
            <Row label="Location consent" value={profile.location_tracking_consent ? '✅ Given' : '❌ Not given'} />
            <Row label="Availability" value={profile.availability?.join(', ') || '—'} />
            <Row label="Preferred areas" value={profile.areas_preferred?.join(', ') || '—'} />
            {profile.languages?.length > 0 && <Row label="Languages" value={profile.languages.join(', ')} />}
          </CardContent>
        </Card>
        {profile.assigned_turf_ids?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Your Assigned Turfs</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{profile.assigned_turf_ids.length} turf(s) assigned — go to Field Mode to begin canvassing.</p>
              <Button className="w-full mt-3" onClick={() => window.location.href = '/field-mode'}>Open Field Mode</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  );
}