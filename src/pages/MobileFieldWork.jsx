import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Phone, Mail, CheckCircle2, AlertCircle, Zap, Clock, Navigation } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function MobileFieldWork() {
  const { campaign } = useCampaign();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterTurf, setFilterTurf] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [doorsToday, setDoorsToday] = useState(0);

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['field-contacts', campaign?.id, filterTurf],
    queryFn: async () => {
      let query = { campaign_id: campaign?.id };
      if (filterTurf) query.notes = { $regex: filterTurf };
      return base44.entities.Contact.filter(query, 'name', 1000);
    },
  });

  // Log interaction mutation
  const logInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-contacts'] });
      setDoorsToday(prev => prev + 1);
      if (currentIndex < contacts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    },
  });

  const currentContact = contacts[currentIndex];
  const totalContacts = contacts.length;
  const progress = totalContacts > 0 ? ((currentIndex + 1) / totalContacts) * 100 : 0;

  const handleInteraction = (outcome) => {
    logInteractionMutation.mutate({
      contact_id: currentContact.id,
      type: 'door_knock',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      outcome,
      notes: `Field interaction: ${outcome}`,
      logged_by: 'field_mode',
    });
  };

  const startSession = () => {
    setSessionActive(true);
    setSessionStart(new Date());
    setDoorsToday(0);
  };

  const endSession = async () => {
    setSessionActive(false);
    // Could log session summary here
  };

  const supportLevelColor = {
    strong_supporter: 'bg-green-100 text-green-800',
    leaning: 'bg-blue-100 text-blue-800',
    undecided: 'bg-yellow-100 text-yellow-800',
    opposed: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Session Timer */}
      {sessionActive && (
        <div className="sticky top-0 z-40 bg-primary text-primary-foreground p-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">Session Active</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{doorsToday} doors</div>
            <div className="text-xs opacity-90">
              {sessionStart && new Date().getTime() - sessionStart.getTime() > 0
                ? `${Math.floor((new Date().getTime() - sessionStart.getTime()) / 60000)}m`
                : '0m'}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Campaign Header */}
        {campaign && !sessionActive && (
          <div className="bg-primary/10 rounded-lg p-4 space-y-2">
            <h1 className="font-heading font-bold text-lg">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">{campaign.candidate_name}</p>
            <Button onClick={startSession} className="w-full gap-2 h-10">
              <Zap className="w-4 h-4" />
              Start Canvassing Session
            </Button>
          </div>
        )}

        {/* Session Active - Contact Card */}
        {sessionActive && currentContact && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Contact {currentIndex + 1} of {totalContacts}</span>
                <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
              </div>
              <div className="bg-secondary rounded-full h-2">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Contact Card */}
            <Card className="touch-manipulation">
              <CardContent className="pt-6 space-y-4">
                {/* Name & Support Level */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">{currentContact.name}</h2>
                  {currentContact.support_level && (
                    <Badge className={`${supportLevelColor[currentContact.support_level] || supportLevelColor.unknown}`}>
                      {currentContact.support_level.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                {/* Address */}
                {currentContact.address && (
                  <div className="flex gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{currentContact.address}</p>
                      <p className="text-xs text-muted-foreground">{currentContact.postcode}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {currentContact.phone && (
                  <a href={`tel:${currentContact.phone}`} className="flex gap-3 text-sm text-primary hover:underline">
                    <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {currentContact.phone}
                  </a>
                )}

                {/* Email */}
                {currentContact.email && (
                  <a href={`mailto:${currentContact.email}`} className="flex gap-3 text-sm text-primary hover:underline">
                    <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {currentContact.email}
                  </a>
                )}

                {/* Key Issues */}
                {currentContact.key_issues?.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Key Issues</p>
                    <div className="flex flex-wrap gap-1">
                      {currentContact.key_issues.map((issue, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {currentContact.notes && (
                  <div className="pt-2 bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">{currentContact.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interaction Buttons - Large Touch Targets */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => handleInteraction('positive')}
                disabled={logInteractionMutation.isPending}
                className="w-full h-12 text-base gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-5 h-5" />
                Positive Response
              </Button>

              <Button
                onClick={() => handleInteraction('neutral')}
                disabled={logInteractionMutation.isPending}
                className="w-full h-12 text-base gap-2"
                variant="outline"
              >
                <Navigation className="w-5 h-5" />
                Neutral / Undecided
              </Button>

              <Button
                onClick={() => handleInteraction('negative')}
                disabled={logInteractionMutation.isPending}
                className="w-full h-12 text-base gap-2 bg-red-600 hover:bg-red-700"
              >
                <AlertCircle className="w-5 h-5" />
                Negative Response
              </Button>

              <Button
                onClick={() => handleInteraction('no_answer')}
                disabled={logInteractionMutation.isPending}
                variant="outline"
                className="w-full h-12 text-base"
              >
                No Answer / Away
              </Button>
            </div>

            {/* Skip Button */}
            <Button
              onClick={() => currentIndex < contacts.length - 1 && setCurrentIndex(prev => prev + 1)}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Skip Contact
            </Button>

            {/* End Session */}
            <Button onClick={endSession} variant="outline" className="w-full text-destructive">
              End Session
            </Button>
          </div>
        )}

        {/* Session Inactive - Filter & List */}
        {!sessionActive && (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Contacts</TabsTrigger>
              <TabsTrigger value="stats">Today's Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <Input
                placeholder="Filter by turf or area..."
                value={filterTurf}
                onChange={e => setFilterTurf(e.target.value)}
                className="h-10"
              />
              <div className="space-y-2">
                {contacts.slice(0, 20).map((contact, i) => (
                  <Card key={contact.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                    <CardContent className="pt-3 pb-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{contact.name}</p>
                        {contact.address && <p className="text-xs text-muted-foreground">{contact.address}</p>}
                        {contact.support_level && (
                          <Badge className="text-xs mt-1" variant="secondary">
                            {contact.support_level.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Session Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Total Contacts</span>
                    <span className="font-bold">{totalContacts}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">Ready to Canvas</span>
                    <span className="font-bold">{contacts.filter(c => !c.canvassed).length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Already Canvassed</span>
                    <span className="font-bold">{contacts.filter(c => c.canvassed).length}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}