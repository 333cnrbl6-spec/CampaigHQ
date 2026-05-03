import React from 'react';
import { usePermissions } from '@/lib/PermissionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Settings, Users, Database, TrendingUp } from 'lucide-react';

export default function DeveloperPortal() {
  const permissions = usePermissions();
  const DEVELOPER_EMAIL = 'developer@yourdomain.com'; // MUST MATCH PermissionContext

  if (permissions.loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!permissions.isDeveloper && permissions.role !== 'admin') {
    return (
      <div className="min-h-screen bg-red-50 p-6 flex items-center justify-center">
        <Card className="max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              This portal is restricted to authorized developers and admins only.
            </p>
            <p className="text-xs text-red-700 mt-2">Your email: {permissions.email}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Developer Portal</h1>
          <p className="text-slate-600 mt-2">Admin & Sales Tools for {permissions.email}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-indigo-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Manage system-wide settings and configurations</p>
              <ul className="space-y-2 text-sm">
                <li>• Application settings</li>
                <li>• Feature flags</li>
                <li>• API keys & webhooks</li>
                <li>• Database maintenance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Manage user accounts and permissions</p>
              <ul className="space-y-2 text-sm">
                <li>• User roles & permissions</li>
                <li>• Campaign assignments</li>
                <li>• Subscription tiers</li>
                <li>• Access audit logs</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Manage and analyze campaign data</p>
              <ul className="space-y-2 text-sm">
                <li>• Bulk data import/export</li>
                <li>• Database cleanup</li>
                <li>• Data isolation verification</li>
                <li>• GDPR compliance tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Analytics & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">View platform-wide analytics</p>
              <ul className="space-y-2 text-sm">
                <li>• Usage metrics</li>
                <li>• Performance monitoring</li>
                <li>• Revenue analytics</li>
                <li>• Campaign effectiveness</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle>Permission Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Role</p>
                <p className="text-lg font-semibold text-slate-900">{permissions.role}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Subscription Tier</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">{permissions.tier}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Status</p>
                <p className="text-lg font-semibold text-green-600">Developer Access</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}