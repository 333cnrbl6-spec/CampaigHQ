import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/lib/PermissionContext';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SubscriptionView() {
  const { tier, modules, email, loading } = usePermissions();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load ONLY current user's campaign data
      const campaigns = await base44.entities.Campaign.filter({
        owner_email: email
      }, '-updated_date', 100);

      setData({
        tier,
        email,
        campaigns: campaigns?.length || 0,
        volunteers: 0, // Load from backend
        contacts: 0,   // Load from backend
      });
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allModules = {
    'dashboard': 'Dashboard & Analytics',
    'contacts': 'Contact Management',
    'volunteers': 'Volunteer Management',
    'map': 'Interactive Maps',
    'reporting': 'Advanced Reporting',
    'automation': 'Outreach Automation',
    'leafleting': 'Leaflet Tracking',
    'api': 'API Access',
    'integrations': 'Third-party Integrations',
    'advanced_analytics': 'Advanced Analytics'
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Subscription</h1>
          <p className="text-slate-600 mt-2">Account: {email}</p>
        </div>

        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl capitalize">{tier} Plan</CardTitle>
              <Badge variant="default" className="text-base">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {data && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-semibold">Active Campaigns</p>
                    <p className="text-3xl font-bold text-blue-900">{data.campaigns}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-semibold">Contacts</p>
                    <p className="text-3xl font-bold text-green-900">{data.contacts}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-semibold">Volunteers</p>
                    <p className="text-3xl font-bold text-purple-900">{data.volunteers}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Available Features</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.entries(allModules).map(([key, label]) => (
                      <div 
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          modules.includes(key) 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {modules.includes(key) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={modules.includes(key) ? 'text-slate-900 text-sm' : 'text-slate-500 text-sm'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}