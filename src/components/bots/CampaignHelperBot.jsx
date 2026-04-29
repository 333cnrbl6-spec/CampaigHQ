import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import OliveAvatar from './OliveAvatar';

const AGENT_NAME = 'campaignHelper';

const PAGE_SUGGESTIONS = {
  '/dashboard': {
    title: '📊 Dashboard Tips',
    suggestions: [
      'Click on support level segments to drill into voter details',
      'Check the 7-day trend to identify momentum patterns',
      'Compare recent activity to spot which areas need attention',
    ]
  },
  '/contacts': {
    title: '👥 Contact Management Tips',
    suggestions: [
      'Use bulk tagging to organize contacts by area or issue priority',
      'Filter by support level to target follow-up conversations',
      'Add notes to capture key voter concerns for personalization',
    ]
  },
  '/field-mode': {
    title: '🚶 Canvassing Tips',
    suggestions: [
      'Contacts are sorted by proximity to save travel time',
      'Log interactions immediately to keep data fresh',
      'Use the support level dropdown to record voter sentiment',
    ]
  },
  '/events': {
    title: '🎯 Event Management Tips',
    suggestions: [
      'Create events to coordinate volunteer activities',
      'Track volunteer RSVPs to plan resources',
      'Send reminders to boost attendance',
    ]
  },
  '/organizer': {
    title: '📈 Campaign Overview Tips',
    suggestions: [
      'Use the coverage map to identify under-canvassed neighborhoods',
      'Monitor support trends to measure campaign momentum',
      'Review interaction outcomes to refine messaging',
    ]
  },
  '/turf': {
    title: '🗺️ Turf Management Tips',
    suggestions: [
      'Draw turf zones to assign canvassing areas to volunteers',
      'Use color coding to track zone status',
      'Optimize routes to maximize volunteer efficiency',
    ]
  },
  '/tasks': {
    title: '✅ Task Management Tips',
    suggestions: [
      'Create tasks for campaign milestones and deadlines',
      'Assign tasks to team members to track responsibility',
      'Categorize by priority to stay focused on what matters most',
    ]
  },
  '/outreach': {
    title: '📧 Outreach Tips',
    suggestions: [
      'Segment contacts by support level for targeted messaging',
      'Use personalization tags to make messages feel personal',
      'Track delivery to measure campaign reach',
    ]
  },
};

export default function CampaignHelperBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const currentPageSuggestions = PAGE_SUGGESTIONS[location.pathname];

  // Initialize conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          name: 'Chat with Olive',
          description: 'Campaign support and guidance',
        },
      });
      setConversationId(conv.id);
      // Add greeting message
      setMessages([{
        role: 'assistant',
        content: "Hi! 👋 I'm **Olive**, your Green Party campaign assistant. I'm here to help with volunteer coordination, voter outreach, event planning, and keeping our campaign running smoothly. What can I help you with today?"
      }]);
    };
    initConversation();
  }, []);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [conversationId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Add context about current page
    const pageContext = location.pathname === '/' ? '' : ` (I'm on the ${location.pathname.slice(1).replace(/-/g, ' ')} page)`;
    const contextualMessage = userMessage + pageContext;

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: contextualMessage,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  // Initialize conversation (no greeting message needed)
  useEffect(() => {
    if (conversationId && !isLoading) {
      setIsLoading(false);
    }
  }, [conversationId]);

  const [showNudge, setShowNudge] = useState(true);

  // Hide nudge after user opens chat once, or after 12 seconds
  useEffect(() => {
    if (isOpen) setShowNudge(false);
  }, [isOpen]);
  useEffect(() => {
    const t = setTimeout(() => setShowNudge(false), 12000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Animated speech bubble nudge */}
      <AnimatePresence>
        {showNudge && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ delay: 1.5 }}
            className="fixed bottom-24 right-20 z-40 max-w-[200px] pointer-events-none"
          >
            <div className="bg-white border border-border shadow-lg rounded-2xl rounded-br-sm px-3 py-2 text-xs text-foreground leading-snug">
              👋 Hi! I'm <strong>Olive</strong> — need help setting up your rounds or importing your maps?
              <div className="absolute bottom-0 right-[-8px] w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat bubble toggle */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => { setIsOpen(!isOpen); setShowNudge(false); }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Open campaign helper"
      >
        {!isOpen && (
          <motion.span
            className="absolute top-0 right-0 w-3.5 h-3.5 bg-accent rounded-full border-2 border-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          />
        )}
        <OliveAvatar size="md" animated={!isOpen} />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-24px)] h-[600px] bg-white rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-emerald-500 to-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <OliveAvatar size="md" animated={false} />
                <div>
                  <h3 className="font-semibold text-sm">Olive</h3>
                  <p className="text-xs text-white/75">Your campaign assistant</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              {messages.length === 1 && !showSuggestions && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setShowSuggestions(true)}
                  className="w-full mt-4"
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-left hover:bg-emerald-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-900">Quick tips for this page</p>
                    </div>
                    <p className="text-xs text-emerald-700">Tap to see page-specific suggestions</p>
                  </div>
                </motion.button>
              )}

              {showSuggestions && currentPageSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2"
                >
                  <p className="text-xs font-semibold text-emerald-900">{currentPageSuggestions.title}</p>
                  {currentPageSuggestions.suggestions.map((suggestion, idx) => (
                    <p key={idx} className="text-xs text-emerald-700">• {suggestion}</p>
                  ))}
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-2"
                  >
                    Got it
                  </button>
                </motion.div>
              )}

              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white text-foreground border border-border/50'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-sm prose-slate max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-foreground border border-border/50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Olive is working on that...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-3 bg-white flex gap-2">
              <Input
                placeholder="Ask Olive anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="text-sm h-9"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="h-9 w-9"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}