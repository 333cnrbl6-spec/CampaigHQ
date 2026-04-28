import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CampaignHelperBot from '../bots/CampaignHelperBot';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <CampaignHelperBot />
    </div>
  );
}