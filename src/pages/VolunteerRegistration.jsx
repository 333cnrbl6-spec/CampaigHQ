import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Play, AlertCircle, Loader2 } from 'lucide-react';
import TrainingVideo from '@/components/onboarding/TrainingVideo';
import CanvassingQuiz from '@/components/onboarding/CanvassingQuiz';
import AvailabilityForm from '@/components/onboarding/AvailabilityForm';

export default function VolunteerRegistration() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  // Load user and existing profile
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser?.email) {
          try {
            const profiles = await base44.entities.VolunteerProfile.filter({
              user_email: currentUser.email,
            });
            if (Array.isArray(profiles) && profiles.length > 0) {
              setProfile(profiles[0]);
            }
          } catch (err) {
            console.error('Failed to fetch profile:', err);
          }
        }
      } catch (err) {
        console.error('Auth failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleVideoComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, 'video']));
    setCurrentStep(2);
  };

  const handleQuizComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, 'quiz']));
    setCurrentStep(3);
  };

  const handleAvailabilitySubmit = async (availabilityData) => {
    if (!user?.email) {
      alert('Unable to save profile — not logged in');
      return;
    }

    setIsSaving(true);
    try {
      const profileData = {
        user_email: user.email,
        full_name: profile?.full_name || user.full_name || '',
        phone: profile?.phone || '',
        availability: availabilityData.availability,
        areas_preferred: availabilityData.areas_preferred,
        languages: availabilityData.languages,
        has_vehicle: availabilityData.has_vehicle,
        setup_complete: true,
        gdpr_consent: availabilityData.gdprConsent,
      };

      if (profile?.id) {
        // Update existing
        await base44.entities.VolunteerProfile.update(profile.id, profileData);
      } else {
        // Create new
        await base44.entities.VolunteerProfile.create(profileData);
      }

      setCompletedSteps((prev) => new Set([...prev, 'availability']));
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Error saving profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">Volunteer Registration</h1>
          <p className="text-muted-foreground">Get trained and ready to start canvassing</p>
        </div>

        {/* Success message */}
        {showSuccess && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Registration Complete!</p>
                <p className="text-sm text-green-800">Redirecting to dashboard...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress steps */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { num: 1, label: 'Training', key: 'video' },
            { num: 2, label: 'Quiz', key: 'quiz' },
            { num: 3, label: 'Availability', key: 'availability' },
          ].map((step) => (
            <div key={step.num} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (completedSteps.has(step.key) || step.num <= currentStep) {
                    setCurrentStep(step.num);
                  }
                }}
                disabled={step.num > currentStep && !completedSteps.has(step.key)}
                className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center transition-all ${
                  completedSteps.has(step.key)
                    ? 'bg-green-600 text-white'
                    : currentStep === step.num
                    ? 'bg-primary text-white'
                    : currentStep > step.num
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-border text-muted-foreground cursor-not-allowed'
                }`}
              >
                {completedSteps.has(step.key) ? '✓' : step.num}
              </button>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Training Video */}
        {currentStep === 1 && (
          <TrainingVideo onComplete={handleVideoComplete} />
        )}

        {/* Step 2: Quiz */}
        {currentStep === 2 && (
          <CanvassingQuiz onComplete={handleQuizComplete} />
        )}

        {/* Step 3: Availability Form */}
        {currentStep === 3 && (
          <AvailabilityForm 
            onSubmit={handleAvailabilitySubmit}
            isSaving={isSaving}
            user={user}
            existingProfile={profile}
          />
        )}
      </div>
    </div>
  );
}