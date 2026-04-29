import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, BarChart2 } from 'lucide-react';
import SessionLogForm from '@/components/canvassing/SessionLogForm';
import SessionSummaryDashboard from '@/components/canvassing/SessionSummaryDashboard';

export default function CanvassingActivity() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsAdmin(u?.role === 'admin');
    }).catch(() => {});
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Canvassing Activity</h1>
        <p className="text-muted-foreground mt-1">Log your session after canvassing, and track the team's overall reach.</p>
      </div>

      <Tabs defaultValue={isAdmin ? 'summary' : 'log'}>
        <TabsList className="mb-6">
          <TabsTrigger value="log" className="gap-2">
            <ClipboardList className="w-4 h-4" /> Log a Session
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <BarChart2 className="w-4 h-4" /> Campaign Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <div className="bg-card border border-border/60 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1">Log Your Canvassing Session</h2>
            <p className="text-sm text-muted-foreground mb-6">Fill in the details from your session — every door counts.</p>
            <SessionLogForm user={user} />
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <SessionSummaryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}