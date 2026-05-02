import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCampaign } from '@/lib/CampaignContext';
import { useAuth } from '@/lib/AuthContext';
import DataFetchError from '@/components/DataFetchError';
import { Upload, Palette } from 'lucide-react';

export default function BrandingSettings() {
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    primary_color: campaign?.primary_color || '#152B45',
    logo_url: campaign?.logo_url || '',
    name: campaign?.name || '',
  });

  // Update campaign branding
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Campaign.update(campaign.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaign?.id] });
    },
  });

  // Only organizers can edit branding
  if (user?.role !== 'admin' && user?.email !== campaign?.owner_email) {
    return (
      <div className="p-8">
        <DataFetchError title="Access Denied" error={{ message: 'Only campaign organizers can edit branding.' }} />
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">Campaign Branding</h1>
          <p className="text-muted-foreground mt-2">Customize colors, logo, and appearance.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tyldesley Green Party 2026"
              />
            </CardContent>
          </Card>

          {/* Primary Color */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Primary Color</CardTitle>
              <CardDescription>Used for buttons, links, and highlights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Hex Color</label>
                  <Input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#152B45"
                    className="mt-1"
                  />
                </div>
                <div
                  className="w-16 h-16 rounded-lg border-2 border-input"
                  style={{ backgroundColor: formData.primary_color }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Logo</CardTitle>
              <CardDescription>PNG or SVG (recommended: square, 500x500px)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo URL</label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              {formData.logo_url && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img src={formData.logo_url} alt="Logo" className="w-32 h-32 object-contain border rounded" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-lg border" style={{ backgroundColor: `${formData.primary_color}15` }}>
                <div className="space-y-3">
                  {formData.logo_url && (
                    <img src={formData.logo_url} alt="Logo" className="w-12 h-12 object-contain" />
                  )}
                  <h2 style={{ color: formData.primary_color }} className="text-lg font-bold">
                    {formData.name}
                  </h2>
                  <Button style={{ backgroundColor: formData.primary_color }}>
                    Sample Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Branding'}
          </Button>

          {updateMutation.isSuccess && (
            <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm">
              ✓ Branding updated successfully
            </div>
          )}
        </form>
      </div>
    </div>
  );
}