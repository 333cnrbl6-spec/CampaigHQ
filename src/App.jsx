import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CampaignProvider, useCampaign } from '@/lib/CampaignContext';
import CampaignSetup from './pages/CampaignSetup';
import { useHardRefreshListener } from '@/hooks/useHardRefreshListener';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Events from './pages/Events';
import Issues from './pages/Issues';
import Tasks from './pages/Tasks';
import WardMap from './pages/WardMap';
import ContactHistory from './pages/ContactHistory';
import VolunteerAssignments from './pages/VolunteerAssignments';
import FieldMode from './pages/FieldMode';
import ElectionDay from './pages/ElectionDay';
import Reports from './pages/Reports';
import TeamChat from './pages/TeamChat';
import CampaignMaterials from './pages/CampaignMaterials';
import Outreach from './pages/Outreach';
import Leaderboard from './pages/Leaderboard';
import TurfManagement from './pages/TurfManagement';
import TurfSheets from './pages/TurfSheets';
import PollingMap from './pages/PollingMap';
import GOTVTracker from './pages/GOTVTracker';
import ActivityFeed from './pages/ActivityFeed';
import SocialMedia from './pages/SocialMedia';
import LandingPage from './pages/LandingPage';
import LeafletTracker from './pages/LeafletTracker';
import DataImport from './pages/DataImport';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminPanel from './pages/AdminPanel';
import RouteOptimizer from './pages/RouteOptimizer';
import OutreachAutomation from './pages/OutreachAutomation';
import VolunteerCalendar from './pages/VolunteerCalendar';
import ShiftManagement from './pages/ShiftManagement';
import CanvassingScripts from './pages/CanvassingScripts';
import LegacyMapImport from './pages/LegacyMapImport';
import PermissionsManager from './pages/PermissionsManager';
import CanvassingActivity from './pages/CanvassingActivity';
import UserManual from './pages/UserManual';
import VoterListImport from './pages/VoterListImport';
import TurfDensityMap from './pages/TurfDensityMap';
import GdprCompliance from './pages/GdprCompliance';
import ContactDistribution from './pages/ContactDistribution';
import CanvassingAnalytics from './pages/CanvassingAnalytics';
import CanvassingDashboard from './pages/CanvassingDashboard';
import LiveTracking from './pages/LiveTracking';
import CanvassingOptimization from './pages/CanvassingOptimization';
import RouteAnalysis from './pages/RouteAnalysis';
import FieldNavigation from './pages/FieldNavigation';
import VolunteerLiveMap from './pages/VolunteerLiveMap';
import AutomatedSequences from './pages/AutomatedSequences';
import VolunteerProfileSetup from './pages/VolunteerProfileSetup';
import VolunteerProfiles from './pages/VolunteerProfiles';
import CampaignSettings from './pages/CampaignSettings';
import VolunteerSignup from './pages/VolunteerSignup';
import DataExport from './pages/DataExport';
import HelpCenter from './pages/HelpCenter';
import LoadTestDashboard from './pages/LoadTestDashboard';
import NationalDashboard from './pages/NationalDashboard';
import NationalReporting from './pages/NationalReporting';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { isLoadingCampaign, needsSetup } = useCampaign();
  useHardRefreshListener();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || isLoadingCampaign) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // User hasn't set up or joined a campaign yet
  if (needsSetup) {
    return <CampaignSetup />;
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contact-history" element={<ContactHistory />} />
        <Route path="/events" element={<Events />} />
        <Route path="/volunteers" element={<VolunteerAssignments />} />
        <Route path="/field-mode" element={<FieldMode />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/election-day" element={<ElectionDay />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/chat" element={<TeamChat />} />
        <Route path="/materials" element={<CampaignMaterials />} />
        <Route path="/map" element={<WardMap />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/gotv" element={<GOTVTracker />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/turf" element={<TurfManagement />} />
        <Route path="/polling-map" element={<PollingMap />} />
        <Route path="/turf-sheets" element={<TurfSheets />} />
        <Route path="/social-media" element={<SocialMedia />} />
        <Route path="/leaflets" element={<LeafletTracker />} />
        <Route path="/import" element={<DataImport />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/route" element={<RouteOptimizer />} />
        <Route path="/automation" element={<OutreachAutomation />} />
        <Route path="/calendar" element={<VolunteerCalendar />} />
        <Route path="/shifts" element={<ShiftManagement />} />
        <Route path="/scripts" element={<CanvassingScripts />} />
        <Route path="/legacy-import" element={<LegacyMapImport />} />
        <Route path="/permissions" element={<PermissionsManager />} />
        <Route path="/canvassing-activity" element={<CanvassingActivity />} />
        <Route path="/manual" element={<UserManual />} />
        <Route path="/voter-import" element={<VoterListImport />} />
        <Route path="/turf-density" element={<TurfDensityMap />} />
        <Route path="/gdpr" element={<GdprCompliance />} />
        <Route path="/distribute" element={<ContactDistribution />} />
        <Route path="/analytics" element={<CanvassingAnalytics />} />
        <Route path="/canvassing-dashboard" element={<CanvassingDashboard />} />
        <Route path="/tracking" element={<LiveTracking />} />
        <Route path="/optimization" element={<CanvassingOptimization />} />
        <Route path="/route-analysis" element={<RouteAnalysis />} />
        <Route path="/field-nav" element={<FieldNavigation />} />
        <Route path="/live-map" element={<VolunteerLiveMap />} />
        <Route path="/sequences" element={<AutomatedSequences />} />
        <Route path="/volunteer-setup" element={<VolunteerProfileSetup />} />
        <Route path="/volunteer-profiles" element={<VolunteerProfiles />} />
        <Route path="/campaign-settings" element={<CampaignSettings />} />
        <Route path="/export" element={<DataExport />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/load-test" element={<LoadTestDashboard />} />
        <Route path="/national" element={<NationalDashboard />} />
        <Route path="/national-reporting" element={<NationalReporting />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function HomeRoute() {
  const { isLoadingAuth, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is authenticated, go to dashboard instead
  if (!authError) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <CampaignProvider>
            <Routes>
              {/* Public routes — redirect to dashboard if authenticated */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/vote" element={<LandingPage />} />
              <Route path="/volunteer" element={<VolunteerSignup />} />
              {/* Auth-gated campaign tool routes */}
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </CampaignProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App