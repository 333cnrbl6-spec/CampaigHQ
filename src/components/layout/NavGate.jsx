import React from 'react';
import { useCampaign } from '@/lib/CampaignContext';

/**
 * Hides nav items based on user role
 * Used by Sidebar to filter available routes
 */
export const getAccessibleNav = (userRole) => {
  const baseNav = [
    'dashboard', 'reports', 'leaderboard', 'activity',
    'contacts', 'field-mode', 'turf', 'route', 'leaflets', 'gotv', 'scripts',
    'shifts', 'volunteer-profiles', 'volunteer-setup', 'live-map', 'events', 'election-day',
    'outreach', 'chat', 'social-media',
  ];

  const adminOnlyNav = [
    'issues', 'tasks', 'import', 'gdpr', 'export', 'vote',
    'admin', 'campaign-settings', 'permissions',
  ];

  if (userRole === 'campaign_admin' || userRole === 'organizer') {
    return [...baseNav, ...adminOnlyNav];
  }

  return baseNav;
};

export default function NavGate({ path, userRole, children, fallback = null }) {
  const accessible = getAccessibleNav(userRole);
  const pathClean = path.replace(/^\//, '');

  if (accessible.includes(pathClean)) {
    return children;
  }

  return fallback;
}