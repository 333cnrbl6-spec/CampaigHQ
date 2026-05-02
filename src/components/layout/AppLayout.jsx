import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import CampaignHelperBot from '../bots/CampaignHelperBot';
import { useCampaign } from '@/lib/CampaignContext';
import { Flag } from 'lucide-react';

export default function AppLayout() {
  const { campaign } = useCampaign();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Campaign identity bar */}
        {campaign && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center gap-2 text-xs text-primary font-medium">
            <Flag className="w-3 h-3 shrink-0" />
            <span>{campaign.name}</span>
            {campaign.candidate_name && (
              <span className="text-muted-foreground font-normal">· {campaign.candidate_name}</span>
            )}
            <Link to="/campaign-settings" className="ml-auto text-muted-foreground hover:text-primary underline underline-offset-2">
              Settings
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CampaignHelperBot />
    </div>
  );
}