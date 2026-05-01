import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Loader2, Navigation, MapPin, Route, Zap } from 'lucide-react';

export default function RouteAnalysis() {
  const [turfFilter, setTurfFilter] = useState('all');
  const [optimizing, setOptimizing] = useState(false);
  const [routes, setRoutes] = useState(null);
  const [maxContactsPerRoute, setMaxContactsPerRoute] = useState(50);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('name', 5000),
  });

  const { data: turfs = [] } = useQuery({
    queryKey: ['turfs'],
    queryFn: () => base44.entities.Turf.list('name', 500),
  });

  const allTurfs = [...new Set(contacts.flatMap(c => c.tags || []))].filter(Boolean).sort();

  const filteredContacts = turfFilter === 'all' 
    ? contacts 
    : contacts.filter(c => c.tags?.includes(turfFilter));

  const handleOptimize = async () => {
    if (!filteredContacts.length) {
      alert('No contacts to optimize');
      return;
    }

    setOptimizing(true);
    try {
      const response = await base44.functions.invoke('optimizeCanvassingRoute', {
        contact_ids: filteredContacts.map(c => c.id),
        turf_id: turfFilter !== 'all' ? turfFilter : null,
        max_contacts_per_route: parseInt(maxContactsPerRoute),
      });

      if (response.data.success) {
        setRoutes(response.data);
      } else {
        alert('Failed to optimize routes');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Route Analysis & Optimization</h1>
        <p className="text-muted-foreground mt-1">Intelligently group contacts into efficient walking routes</p>
      </div>

      {/* Controls */}
      <Card className="mb-8 bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Optimization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Turf Zone</label>
              <Select value={turfFilter} onValueChange={setTurfFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  {allTurfs.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Contacts Per Route</label>
              <Select value={maxContactsPerRoute.toString()} onValueChange={setMaxContactsPerRoute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 doors</SelectItem>
                  <SelectItem value="50">50 doors</SelectItem>
                  <SelectItem value="75">75 doors</SelectItem>
                  <SelectItem value="100">100 doors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleOptimize}
            disabled={optimizing || !filteredContacts.length}
            className="w-full gap-2"
          >
            {optimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Optimizing {filteredContacts.length} contacts...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Optimized Routes ({filteredContacts.length} contacts)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {routes && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{routes.stats.total_routes}</div>
                <p className="text-sm text-muted-foreground mt-1">Optimized Routes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{routes.stats.total_distance_km}</div>
                <p className="text-sm text-muted-foreground mt-1">Total Walking Distance (km)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{routes.stats.avg_distance_per_route}</div>
                <p className="text-sm text-muted-foreground mt-1">Avg Distance Per Route (km)</p>
              </CardContent>
            </Card>
          </div>

          {/* Routes List */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">Individual Routes</h2>
            {routes.routes.map((route, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Route {idx + 1}</CardTitle>
                    <Badge variant="secondary">
                      {route.stop_count} doors · {route.distance_km} km
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {route.contacts.slice(0, 15).map((contact, stopIdx) => (
                      <div key={contact.id} className="flex items-center gap-3 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                          {stopIdx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{contact.address}</p>
                        </div>
                        {stopIdx < Math.min(14, route.contacts.length - 1) && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    ))}
                    {route.contacts.length > 15 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{route.contacts.length - 15} more contacts
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unlocated Contacts Warning */}
          {routes.unlocated_contacts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-medium text-sm text-amber-900 mb-2">
                ⚠️ {routes.unlocated_contacts.length} contact{routes.unlocated_contacts.length !== 1 ? 's' : ''} couldn't be routed (no location data)
              </p>
              <div className="text-sm text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                {routes.unlocated_contacts.map(c => (
                  <div key={c.id}>{c.name}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!routes && !optimizing && (
        <div className="text-center py-12 bg-card/50 rounded-xl border border-border/50">
          <Route className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Configure settings and generate optimized routes</p>
        </div>
      )}
    </div>
  );
}