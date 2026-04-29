import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, RefreshCw, User, MessageSquare, ChevronRight } from 'lucide-react';
import ScriptDisplay from '@/components/canvassing/ScriptDisplay';

const SUPPORT_LABELS = {
  strong_supporter: { label: 'Strong Supporter', color: 'bg-green-100 text-green-800' },
  leaning: { label: 'Leaning', color: 'bg-teal-100 text-teal-800' },
  undecided: { label: 'Undecided', color: 'bg-yellow-100 text-yellow-800' },
  opposed: { label: 'Opponent', color: 'bg-red-100 text-red-800' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' },
};

export default function CanvassingScripts() {
  const [selectedContact, setSelectedContact] = useState(null);
  const [overrideSupportLevel, setOverrideSupportLevel] = useState('');
  const [feedback, setFeedback] = useState('');
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.ContactInteraction.list(),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => base44.entities.Issue.list(),
  });

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.postcode?.toLowerCase().includes(search.toLowerCase())
  );

  const contactInteractions = selectedContact
    ? interactions.filter(i => i.contact_id === selectedContact.id).slice(0, 5)
    : [];

  const handleGenerate = async () => {
    if (!selectedContact) return;
    setLoading(true);
    setScript(null);
    try {
      const res = await base44.functions.invoke('generateCanvassingScript', {
        contact: selectedContact,
        support_level: overrideSupportLevel || selectedContact.support_level,
        interactions: contactInteractions,
        issues: issues.slice(0, 6),
        feedback: feedback || null,
      });
      setScript(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">AI Canvassing Scripts</h1>
        <p className="text-muted-foreground mt-1">Generate personalised scripts for any contact, adapted to their support level and history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact selector */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Select Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => { setSelectedContact(contact); setScript(null); setOverrideSupportLevel(''); }}
                    className={`w-full text-left p-2.5 rounded-lg border-2 transition-all text-sm ${
                      selectedContact?.id === contact.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{contact.postcode}</span>
                      {contact.support_level && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SUPPORT_LABELS[contact.support_level]?.color}`}>
                          {SUPPORT_LABELS[contact.support_level]?.label}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedContact && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Script Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Override Support Level</label>
                  <Select value={overrideSupportLevel} onValueChange={setOverrideSupportLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Use contact's: ${SUPPORT_LABELS[selectedContact.support_level]?.label || 'Unknown'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Use contact's level</SelectItem>
                      {Object.entries(SUPPORT_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">Feedback / Adaptation Notes</label>
                  <Textarea
                    placeholder="e.g. 'They mentioned concerns about parking', 'Previous visit went well', 'They're interested in green spaces'..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                {contactInteractions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">RECENT INTERACTIONS ({contactInteractions.length})</p>
                    <div className="space-y-1">
                      {contactInteractions.map(i => (
                        <div key={i.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          <span className="capitalize">{i.type.replace('_', ' ')}</span>
                          <Badge variant="secondary" className="text-[10px] h-4">{i.outcome}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
                  {loading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> Generate Script</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Script output */}
        <div className="lg:col-span-2">
          {!selectedContact ? (
            <Card className="h-full flex items-center justify-center min-h-64">
              <div className="text-center text-muted-foreground p-8">
                <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a contact to generate a script</p>
                <p className="text-sm mt-1">The AI will tailor the script to their support level, key issues, and interaction history</p>
              </div>
            </Card>
          ) : loading ? (
            <Card className="h-full flex items-center justify-center min-h-64">
              <div className="text-center text-muted-foreground p-8">
                <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
                <p className="font-medium">Generating personalised script...</p>
                <p className="text-sm mt-1">Analysing contact history and campaign issues</p>
              </div>
            </Card>
          ) : script ? (
            <ScriptDisplay script={script} contact={selectedContact} onRegenerate={handleGenerate} />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-64">
              <div className="text-center text-muted-foreground p-8">
                <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Ready to generate</p>
                <p className="text-sm mt-1">Configure options and click Generate Script</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}