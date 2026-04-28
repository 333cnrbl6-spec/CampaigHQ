import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ScriptGenerator({ contact, isOpen, onClose }) {
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateScript = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateCanvassingScript', {
        contactId: contact.id,
        supportLevel: contact.support_level,
      });
      setScript(response.data.script);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = `
OPENING: ${script.opening}

FOLLOW-UP QUESTIONS:
${script.followUpQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

TALKING POINTS:
${script.talkingPoints.map((p, i) => `• ${p}`).join('\n')}

HANDLING OBJECTIONS:
${Object.entries(script.handleObjections).map(([obj, response]) => `Q: "${obj}"\nA: ${response}`).join('\n\n')}

CLOSE: ${script.close}
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Canvassing Script for {contact?.name}</DialogTitle>
        </DialogHeader>

        {!script ? (
          <div className="space-y-4 py-6">
            <p className="text-sm text-muted-foreground">
              Generate a personalized canvassing script with opening lines, follow-up questions, talking points, and objection handling based on {contact?.name}'s profile and interaction history.
            </p>
            <Button
              onClick={generateScript}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Script...</>
              ) : (
                'Generate Script'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Opening */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-sm mb-2 text-blue-900">Opening Line</h3>
              <p className="text-sm text-blue-800">{script.opening}</p>
            </div>

            {/* Follow-up Questions */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Follow-up Questions</h3>
              <div className="space-y-2">
                {script.followUpQuestions.map((q, i) => (
                  <div key={i} className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">{i + 1}. {q}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Talking Points */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Talking Points</h3>
              <ul className="space-y-2">
                {script.talkingPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-medium">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Handling Objections */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Handling Objections</h3>
              <div className="space-y-3">
                {Object.entries(script.handleObjections).map(([objection, response], i) => (
                  <div key={i} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="font-medium text-sm text-amber-900 mb-1">"{objection}"</p>
                    <p className="text-sm text-amber-800">{response}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Close */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-sm mb-2 text-green-900">Close</h3>
              <p className="text-sm text-green-800">{script.close}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1 gap-2"
              >
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Script</>
                )}
              </Button>
              <Button
                onClick={() => setScript(null)}
                variant="outline"
                className="flex-1 gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}