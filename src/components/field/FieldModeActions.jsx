import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, X, Navigation, ShieldAlert } from 'lucide-react';

export default function FieldModeActions({ 
  onLogInteraction, 
  onPrevious, 
  onNext, 
  onSkip, 
  onWelfareCheckIn,
  onDirections,
  canGoPrevious, 
  canGoNext,
  welfareCheckedIn,
  isSubmitting
}) {
  return (
    <div className="space-y-2 flex-shrink-0">
      <div className="flex gap-2">
        <Button 
          className="flex-1 h-12 sm:h-11 text-sm sm:text-base gap-2" 
          onClick={onLogInteraction}
          disabled={isSubmitting}
        >
          <Check className="w-4 sm:w-5 h-4 sm:h-5" /> <span className="hidden sm:inline">Log</span> Interaction
        </Button>
        <Button
          variant="outline"
          className="h-12 sm:h-11 px-3 gap-1.5 text-blue-600 border-blue-300 flex-shrink-0"
          onClick={onDirections}
          title="Get walking directions"
        >
          <Navigation className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 h-10" 
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 h-10" 
          onClick={onNext}
          disabled={!canGoNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          className="flex-1 h-10 text-destructive" 
          onClick={onSkip}
        >
          <X className="w-4 h-4" /> Skip
        </Button>
      </div>
      <button
        onClick={onWelfareCheckIn}
        className={`w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
          welfareCheckedIn
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
        }`}
      >
        <ShieldAlert className="w-4 h-4" />
        {welfareCheckedIn ? '✓ Safe check-in sent' : 'Tap to confirm you\'re safe'}
      </button>
    </div>
  );
}