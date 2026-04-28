import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio } from 'lucide-react';
import LiveActivityFeed from '../components/activity/LiveActivityFeed';

export default function ActivityFeed() {
  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <Radio className="w-7 h-7 text-primary" /> Live Activity Feed
        </h1>
        <p className="text-muted-foreground mt-1">Real-time voter interactions logged by your canvassers</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Live
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LiveActivityFeed limit={50} />
        </CardContent>
      </Card>
    </div>
  );
}