import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2 } from 'lucide-react';

const DAYS_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Evenings',
  'Weekends',
];

const AREAS_OPTIONS = ['Tyldesley', 'Astley', 'Mosley Common', 'Other'];

const LANGUAGES_OPTIONS = ['English', 'Spanish', 'Polish', 'Urdu', 'Mandarin', 'Other'];

export default function AvailabilityForm({ onSubmit, isSaving, user, existingProfile }) {
  const [phone, setPhone] = useState(existingProfile?.phone || '');
  const [availability, setAvailability] = useState(existingProfile?.availability || []);
  const [areas, setAreas] = useState(existingProfile?.areas_preferred || []);
  const [languages, setLanguages] = useState(existingProfile?.languages || ['English']);
  const [hasVehicle, setHasVehicle] = useState(existingProfile?.has_vehicle || false);
  const [gdprConsent, setGdprConsent] = useState(existingProfile?.gdpr_consent || false);
  const [errors, setErrors] = useState({});

  const handleAvailabilityToggle = (day) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAreaToggle = (area) => {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleLanguageToggle = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (availability.length === 0) {
      newErrors.availability = 'Select at least one day or time';
    }
    if (areas.length === 0) {
      newErrors.areas = 'Select at least one area';
    }
    if (!gdprConsent) {
      newErrors.gdpr = 'You must accept the data processing consent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      availability,
      areas_preferred: areas,
      languages,
      has_vehicle: hasVehicle,
      gdprConsent,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Availability & Preferences</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Help us schedule canvassing sessions that work for you
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07700 123456"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Availability */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              When are you available? <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS_OPTIONS.map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={availability.includes(day)}
                    onCheckedChange={() => handleAvailabilityToggle(day)}
                  />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
            {errors.availability && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.availability}
              </p>
            )}
          </div>

          {/* Preferred Areas */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Which areas do you prefer? <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AREAS_OPTIONS.map((area) => (
                <label key={area} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={areas.includes(area)}
                    onCheckedChange={() => handleAreaToggle(area)}
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
            {errors.areas && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.areas}
              </p>
            )}
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Languages you speak</label>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES_OPTIONS.map((lang) => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={languages.includes(lang)}
                    onCheckedChange={() => handleLanguageToggle(lang)}
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vehicle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={hasVehicle}
              onCheckedChange={setHasVehicle}
            />
            <span className="text-sm">I have a car and can help with transport</span>
          </label>

          {/* GDPR Consent */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={gdprConsent}
                onCheckedChange={setGdprConsent}
                className="mt-1"
              />
              <span className="text-sm leading-relaxed">
                I consent to Base44 storing my contact information and availability for campaign
                coordination, welfare checks during canvassing, and communication about volunteering
                opportunities. I understand my data will be kept secure and only used for campaign
                purposes.
              </span>
            </label>
            {errors.gdpr && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.gdpr}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Complete Registration →'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}