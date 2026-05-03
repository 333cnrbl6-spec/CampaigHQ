import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Play } from 'lucide-react';
import { useState } from 'react';

export default function Testimonials() {
  const [selectedVideo, setSelectedVideo] = useState(0);

  const videoTestimonials = [
    {
      name: 'Emma Thompson',
      role: 'Candidate, Tyldesley',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      quote: 'This platform transformed how we organize volunteers. We won with a 127-vote margin.',
      videoUrl: '#',
    },
    {
      name: 'James Mitchell',
      role: 'Campaign Manager, North West',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      quote: 'Real-time data on voter sentiment helped us target our message. Game changer.',
      videoUrl: '#',
    },
    {
      name: 'Sarah Chen',
      role: 'Volunteer Coordinator',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      quote: 'No more spreadsheets. Volunteers love the mobile app. Engagement is way up.',
      videoUrl: '#',
    },
  ];

  const textTestimonials = [
    {
      name: 'Michael O\'Brien',
      role: 'Regional Organiser, Labour',
      quote:
        'We tested this against our internal tools. The canvassing optimization alone saved us 15% on volunteer hours.',
      rating: 5,
    },
    {
      name: 'Dr. Patricia Okafor',
      role: 'Political Science Professor',
      quote:
        'My students are learning on the same platform real campaigns use. This is the future of political organizing.',
      rating: 5,
    },
    {
      name: 'David Harris',
      role: 'Conservative Campaign Lead',
      quote:
        'Cross-party adoption speaks volumes. The features work regardless of ideology. Highly recommend.',
      rating: 5,
    },
    {
      name: 'Lisa Wong',
      role: 'Environmental Campaign Director',
      quote:
        'We adapted it for our climate campaign. The volunteer coordination features are perfect for grassroots organizing.',
      rating: 5,
    },
    {
      name: 'Tom Bradley',
      role: 'Data Analytics Consultant',
      quote:
        'The API is clean and well-documented. Integration with our analytics platform took less than a day.',
      rating: 5,
    },
    {
      name: 'Rebecca Martin',
      role: 'Lib Dem Campaign Manager',
      quote:
        'GDPR compliance built-in. No extra work auditing data. Peace of mind for sensitive voter information.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold">Trusted by Campaign Leaders</h1>
          <p className="text-xl text-muted-foreground">
            Hear from campaigns that won using Base44's comprehensive canvassing platform
          </p>
        </div>

        {/* Video Testimonials */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Video Testimonials</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-muted border-none overflow-hidden aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Play className="w-16 h-16 text-primary" />
                  <p className="text-muted-foreground">Video: {videoTestimonials[selectedVideo].name}</p>
                </div>
              </Card>
              <Card className="mt-4 border-none">
                <CardContent className="pt-6 space-y-3">
                  <p className="text-lg font-semibold">{videoTestimonials[selectedVideo].name}</p>
                  <p className="text-sm text-muted-foreground">
                    {videoTestimonials[selectedVideo].role}
                  </p>
                  <p className="text-base italic">
                    "{videoTestimonials[selectedVideo].quote}"
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Video List */}
            <div className="space-y-2">
              {videoTestimonials.map((video, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedVideo(i)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedVideo === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <p className="font-medium text-sm">{video.name}</p>
                  <p className="text-xs opacity-75">{video.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Testimonials */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Written Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {textTestimonials.map((testimonial, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 fill-accent text-accent"
                      />
                    ))}
                  </div>
                  <p className="text-foreground italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">1000+</p>
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">500K+</p>
                <p className="text-sm text-muted-foreground">Voter Contacts</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">4.9★</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4 py-8">
          <h3 className="text-2xl font-heading font-bold">Join successful campaigns</h3>
          <Button size="lg">Start Your Free Trial Today</Button>
        </div>
      </div>
    </div>
  );
}