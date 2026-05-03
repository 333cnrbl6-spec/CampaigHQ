import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Leaf, ShieldCheck, Map, Navigation, ClipboardList, Users, ChevronRight, Zap, Home, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FieldHub() {
  const navigate = useNavigate();
  const { campaign } = useCampaign();
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    base44.auth.me().then(u => {
      if (u) setUser(u);
    });
  }, []);

  // Check volunteer profile
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.VolunteerProfile.filter({ user_email: user.email }).then(profiles => {
      const ok = Array.isArray(profiles) && profiles.some(p => p?.setup_complete && p?.gdpr_consent);
      setProfileComplete(ok);
    }).catch(() => {});
  }, [user]);

  const { data: myTurfs = [] } = useQuery({
    queryKey: ['my-turfs'],
    queryFn: () => base44.functions.invoke('getAssignedTurfs', {}).then(r => r.data?.turfs || []),
    enabled: !!campaign?.id,
  });

  const { data: leafletRuns = [] } = useQuery({
    queryKey: ['my-leaflet-runs'],
    queryFn: () => base44.entities.LeafletRun.filter({ campaign_id: campaign?.id }, 'street_name', 200),
    enabled: !!campaign?.id,
  });

  const pendingLeaflets = leafletRuns.filter(r => r.status !== 'completed').length;
  const completedLeaflets = leafletRuns.filter(r => r.status === 'completed').length;
  const assignedTurfs = myTurfs.filter(t => t.status !== 'completed').length;

  const firstName = user?.full_name?.split(' ')[0] || 'Volunteer';

  const actions = [
    {
      id: 'canvassing',
      icon: MapPin,
      title: 'Door Knocking',
      subtitle: 'Record voter responses at the door',
      color: 'bg-primary',
      textColor: 'text-white',
      badge: assignedTurfs > 0 ? `${assignedTurfs} turf${assignedTurfs > 1 ? 's' : ''} assigned` : null,
      badgeColor: 'bg-white/20 text-white',
      route: '/field-mode',
    },
    {
      id: 'leaflets',
      icon: Home,
      title: 'Leaflet Drop',
      subtitle: 'Mark streets complete as you deliver',
      color: 'bg-blue-600',
      textColor: 'text-white',
      badge: pendingLeaflets > 0 ? `${pendingLeaflets} streets remaining` : completedLeaflets > 0 ? 'All done!' : null,
      badgeColor: pendingLeaflets > 0 ? 'bg-white/20 text-white' : 'bg-green-400/30 text-green-100',
      route: '/leaflet-field',
    },
    {
      id: 'map',
      icon: Map,
      title: 'My Turf Map',
      subtitle: 'View your assigned area on the map',
      color: 'bg-emerald-600',
      textColor: 'text-white',
      badge: null,
      route: '/turf',
    },
    {
      id: 'route',
      icon: Navigation,
      title: 'Optimise Route',
      subtitle: 'Get the most efficient walking order',
      color: 'bg-violet-600',
      textColor: 'text-white',
      badge: null,
      route: '/route',
    },
  ];

  const quickLinks = [
    { icon: ClipboardList, label: 'My Tasks', route: '/tasks' },
    { icon: Users, label: 'Shifts', route: '/shifts' },
    { icon: BarChart2, label: 'My Stats', route: '/leaderboard' },
    { icon: ShieldCheck, label: 'Profile & Safety', route: '/volunteer-setup' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-primary-foreground/70 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold font-heading">{firstName}</h1>
          </div>
          {campaign?.logo_url ? (
            <img src={campaign.logo_url} alt="Campaign" className="h-10 w-10 object-contain rounded-full bg-white/10 p-1" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        {campaign?.name && (
          <p className="text-primary-foreground/60 text-xs mt-1">{campaign.name}</p>
        )}

        {/* Profile incomplete warning */}
        {!profileComplete && (
          <button
            onClick={() => navigate('/volunteer-setup')}
            className="mt-4 w-full flex items-center gap-3 bg-amber-400/20 border border-amber-300/30 rounded-xl px-4 py-3 text-left"
          >
            <ShieldCheck className="w-5 h-5 text-amber-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-200">Complete your profile</p>
              <p className="text-xs text-amber-300/80">Add emergency contact before going out — takes 2 mins</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-300 flex-shrink-0" />
          </button>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Main Actions */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">What are you doing today?</p>
          <div className="grid grid-cols-2 gap-3">
            {actions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.route)}
                  className={`${action.color} rounded-2xl p-4 text-left active:scale-95 transition-transform shadow-sm`}
                >
                  <Icon className={`w-6 h-6 ${action.textColor} mb-3`} />
                  <p className={`font-bold text-sm ${action.textColor} leading-tight`}>{action.title}</p>
                  <p className={`text-xs mt-1 ${action.textColor} opacity-75 leading-tight`}>{action.subtitle}</p>
                  {action.badge && (
                    <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-card border border-border/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Today's Overview</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-primary">{assignedTurfs}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Active<br />Turfs</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{pendingLeaflets}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Streets<br />To Do</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{completedLeaflets}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Streets<br />Done</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">More</p>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <button
                  key={link.route}
                  onClick={() => navigate(link.route)}
                  className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-4 py-3 text-left hover:bg-muted/30 active:scale-95 transition-transform"
                >
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium">{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Safety reminder */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Stay safe out there</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Always tell your team lead when you're heading out. Use the welfare check-in button in Field Mode every 20 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}