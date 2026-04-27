import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Send, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamChat() {
  const [selectedThread, setSelectedThread] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [formData, setFormData] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const queryClient = useQueryClient();

  // Get current user
  useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user));
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['team_messages'],
    queryFn: () => base44.entities.TeamMessage.list('-created_date', 100),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const createMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_messages'] });
      setFormData({});
      setShowNewMessage(false);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_messages'] });
      setReplyText('');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id, read }) => base44.entities.TeamMessage.update(id, { read }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_messages'] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMessage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_messages'] });
    },
  });

  const handleNewMessage = () => {
    if (formData.to && formData.subject && formData.message) {
      createMessageMutation.mutate({
        from: currentUser?.email || 'campaign@example.com',
        from_name: currentUser?.full_name || 'Campaign',
        to: formData.to,
        subject: formData.subject,
        message: formData.message,
        read: false,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleReply = () => {
    if (replyText && selectedThread) {
      replyMutation.mutate({
        from: currentUser?.email || 'campaign@example.com',
        from_name: currentUser?.full_name || 'Campaign',
        to: selectedThread.from,
        subject: `Re: ${selectedThread.subject}`,
        message: replyText,
        read: false,
        timestamp: new Date().toISOString(),
        event_related: selectedThread.event_related,
      });
    }
  };

  // Group messages by conversation
  const conversations = {};
  messages.forEach(msg => {
    const key = [msg.from, msg.to].sort().join('|');
    if (!conversations[key]) {
      conversations[key] = [];
    }
    conversations[key].push(msg);
  });

  const conversationList = Object.entries(conversations).map(([key, msgs]) => ({
    key,
    messages: msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    lastMessage: msgs[msgs.length - 1],
    unread: msgs.filter(m => !m.read && m.to === currentUser?.email).length,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading text-foreground">Team Collaboration</h1>
        <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">To</label>
                <Select value={formData.to || ''} onValueChange={(val) => setFormData({...formData, to: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paul@campaign.com">Paul Binns</SelectItem>
                    <SelectItem value="margaret@campaign.com">Margaret Thompson</SelectItem>
                    <SelectItem value="james@campaign.com">James Whitfield</SelectItem>
                    <SelectItem value="david@campaign.com">David Cartwright</SelectItem>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.email || c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Message subject"
                  value={formData.subject || ''}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Your message..."
                  value={formData.message || ''}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="min-h-24"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewMessage(false)}>Cancel</Button>
                <Button onClick={handleNewMessage}>Send</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {conversationList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              ) : (
                conversationList.map((conv) => (
                  <button
                    key={conv.key}
                    onClick={() => setSelectedThread(conv.lastMessage)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedThread?.id === conv.lastMessage.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {conv.lastMessage.from === currentUser?.email ? 'To: ' : 'From: '}
                          {conv.lastMessage.from === currentUser?.email ? conv.lastMessage.to : conv.lastMessage.from}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conv.lastMessage.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="flex-shrink-0">{conv.unread}</Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle>{selectedThread.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      From: {selectedThread.from} • {format(new Date(selectedThread.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markReadMutation.mutate({id: selectedThread.id, read: !selectedThread.read})}
                    >
                      {selectedThread.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMessageMutation.mutate(selectedThread.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{selectedThread.message}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm">Cancel</Button>
                    <Button size="sm" onClick={handleReply} className="gap-2">
                      <Send className="w-4 h-4" /> Send Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground h-full flex items-center justify-center">
              Select a conversation to view messages
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}