import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

const AGENT_NAME = 'campaignHelper';

export default function CampaignHelperBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Initialize conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          name: 'Campaign Helper Chat',
          description: 'Live assistance with campaign tasks',
        },
      });
      setConversationId(conv.id);
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

    await base44.agents.addMessage({
      id: conversationId,
      messages,
    }, {
      role: 'user',
      content: contextualMessage,
    });
  };

  // Initial greeting based on page
  useEffect(() => {
    if (conversationId && messages.length === 0 && !isLoading) {
      const pageContext = {
        '/dashboard': 'the Dashboard',
        '/contacts': 'the Voter Contacts manager',
        '/field-mode': 'Field Mode for canvassing',
        '/events': 'Campaign Events',
        '/tasks': 'Tasks',
        '/reports': 'Reports',
        '/turf': 'Turf Management',
        '/chat': 'Team Chat',
        '/outreach': 'Bulk Outreach',
      }[location.pathname] || 'the campaign tool';

      const greeting = `Hi! I'm Olive, your friendly Green Party campaign assistant. I'm here on ${pageContext} to help with suggestions, guidance, and real-time support. What can I help you with?`;
      
      setIsLoading(true);
      base44.agents.addMessage(
        { id: conversationId, messages: [] },
        { role: 'assistant', content: greeting }
      );
    }
  }, [conversationId, messages.length, location.pathname]);

  return (
    <>
      {/* Chat bubble toggle */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Open campaign helper"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="bg-gradient-to-r from-primary to-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
                  🌿
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Olive</h3>
                  <p className="text-xs text-white/70">Campaign Helper</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
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
                    <span className="text-xs">Olive is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-3 bg-white flex gap-2">
              <Input
                placeholder="Ask for help..."
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