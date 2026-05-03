import { useCampaign } from '@/lib/CampaignContext';
import CanvassingLeaderboard from '@/components/leaderboard/CanvassingLeaderboard';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const { campaign } = useCampaign();

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" /> Campaign Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">Volunteer rankings by doors knocked, conversations, and voter contacts</p>
      </div>

      {campaign?.id && <CanvassingLeaderboard campaignId={campaign.id} />}
    </div>
  );
}