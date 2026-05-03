import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2 } from 'lucide-react';

export default function TrainingVideo({ onComplete }) {
  const [watching, setWatching] = useState(false);
  const [watched, setWatched] = useState(false);

  const handleVideoEnd = () => {
    setWatched(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Canvassing Training Video
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Learn the fundamentals of door-to-door canvassing, voter engagement, and data collection
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center relative">
          {!watching ? (
            <button
              onClick={() => setWatching(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors group"
            >
              <Play className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
            </button>
          ) : null}
          
          {watching && (
            <video
              className="w-full h-full"
              controls
              onEnded={handleVideoEnd}
              autoPlay
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {!watching && (
            <div className="text-center text-white">
              <p className="text-lg font-semibold mb-2">Canvassing Basics Training</p>
              <p className="text-sm text-gray-300">8 minutes</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold">What you'll learn:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>How to introduce yourself and your campaign</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>How to listen and identify voter concerns</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>How to record interactions and support levels</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Safety tips and welfare check-in procedures</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {watched && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Video watched</span>
            </div>
          )}
          <Button
            onClick={onComplete}
            disabled={!watched}
            className="ml-auto"
          >
            {watched ? 'Continue to Quiz →' : 'Watch the video first'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}