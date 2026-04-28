import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
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
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
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
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App