import { useCampaign } from '@/lib/CampaignContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

export default function CampaignSwitcher() {
  const { campaign, campaigns, switchCampaign, userRole } = useCampaign();

  if (!campaigns || campaigns.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-muted-foreground" />
      <Select value={campaign?.id} onValueChange={switchCampaign}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select campaign" />
        </SelectTrigger>
        <SelectContent>
          {campaigns.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
              <span className="text-xs text-muted-foreground ml-2">
                ({c.userRole})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}