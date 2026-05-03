import { useAuth } from '@/lib/AuthContext';
import { Lock } from 'lucide-react';

const OWNER_EMAIL = '333cnrbl6@gmail.com';

/**
 * Wraps content that should only be visible to the platform owner.
 * All other authenticated users see a generic "restricted" screen.
 */
export default function OwnerOnly({ children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.email !== OWNER_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-heading text-xl font-bold">Restricted Area</h2>
          <p className="text-muted-foreground text-sm">
            This section is not available for your account. If you believe this is an error, please contact your campaign administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
}