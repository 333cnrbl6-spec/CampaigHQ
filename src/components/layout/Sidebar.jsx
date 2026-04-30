import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, Leaf, ClipboardList, 
  MapPin, ChevronLeft, ChevronRight, LogOut, BarChart3, MessageSquare,
  History, Zap, Printer, Send, Trophy, Target, Radio, Share2, Globe, Upload, Route, Wand2, FileText, Shield, BookOpen, ListChecks
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const navSections = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/activity', label: 'Live Activity', icon: Radio },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'Contacts',
    items: [
      { path: '/contacts', label: 'Voter Contacts', icon: Users },
      { path: '/contact-history', label: 'Contact History', icon: History },
      { path: '/field-mode', label: 'Field Mode', icon: Zap },
      { path: '/gotv', label: 'GOTV Tracker', icon: Target },
      { path: '/canvassing-activity', label: 'Session Activity', icon: ClipboardList },
      { path: '/scripts', label: 'Canvassing Scripts', icon: Wand2 },
    ],
  },
  {
    label: 'Maps & Routes',
    items: [
      { path: '/map', label: 'Ward Map', icon: MapPin },
      { path: '/turf', label: 'Turf Management', icon: MapPin },
      { path: '/polling-map', label: 'Polling Districts', icon: MapPin },
      { path: '/turf-sheets', label: 'Turf Sheets', icon: Printer },
      { path: '/route', label: 'Route Optimizer', icon: Route },
      { path: '/leaflets', label: 'Leaflet Distribution', icon: MapPin },
    ],
  },
  {
    label: 'Events & Volunteers',
    items: [
      { path: '/events', label: 'Events', icon: Calendar },
      { path: '/shifts', label: 'Shift Management', icon: Calendar },
      { path: '/calendar', label: 'Volunteer Calendar', icon: Calendar },
      { path: '/volunteers', label: 'Volunteer Assignments', icon: Users },
      { path: '/election-day', label: 'Election Day', icon: ClipboardList },
    ],
  },
  {
    label: 'Outreach & Comms',
    items: [
      { path: '/outreach', label: 'Bulk Outreach', icon: Send },
      { path: '/automation', label: 'Outreach Automation', icon: Zap },
      { path: '/social-media', label: 'Social Media', icon: Share2 },
      { path: '/chat', label: 'Team Chat', icon: MessageSquare },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: '/issues', label: 'Local Issues', icon: Leaf },
      { path: '/tasks', label: 'Tasks', icon: ClipboardList },
      { path: '/materials', label: 'Campaign Materials', icon: Printer },
      { path: '/import', label: 'Import Data', icon: Upload },
      { path: '/voter-import', label: 'Import Voter List', icon: Users },
      { path: '/legacy-import', label: 'Import Map Files', icon: FileText },
      { path: '/vote', label: 'Campaign Landing Page', icon: Globe },
      { path: '/permissions', label: 'Permissions', icon: Shield },
      { path: '/manual', label: 'User Manual', icon: BookOpen },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 sticky top-0",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      {/* Header */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-heading text-lg font-bold text-sidebar-foreground leading-tight">Paul Binns</h1>
              <p className="text-xs text-sidebar-foreground/60 leading-tight">Green Party Campaign</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-4">
        {navSections.map(({ label, items }) => (
          <div key={label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {label}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ path, label: itemLabel, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    title={collapsed ? itemLabel : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{itemLabel}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}