import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCampaign } from '@/lib/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Download, Eye, RefreshCw } from 'lucide-react';
import TargetListBuilder from '@/components/segmentation/TargetListBuilder';
import TargetListPreview from '@/components/segmentation/TargetListPreview';

export default function TargetListManager() {
  const { campaign } = useCampaign();
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [previewList, setPreviewList] = useState(null);

  // Fetch target lists
  const { data: targetLists = [], isLoading } = useQuery({
    queryKey: ['targetLists', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const all = await base44.entities.TargetList.list('-created_date', 500);
      return Array.isArray(all) ? all.filter(t => t.campaign_id === campaign.id) : [];
    },
  });

  // Fetch contacts for segmentation
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const all = await base44.entities.Contact.list('-created_date', 10000);
      return Array.isArray(all) ? all.filter(c => c.campaign_id === campaign.id) : [];
    },
  });

  // Fetch interactions for history analysis
  const { data: interactions = [] } = useQuery({
    queryKey: ['contactInteractions', campaign?.id],
    queryFn: async () => {
      if (!campaign?.id) return [];
      const all = await base44.entities.ContactInteraction.list('-date', 5000);
      return Array.isArray(all) ? all : [];
    },
  });

  // Save target list
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingList?.id) {
        return base44.entities.TargetList.update(editingList.id, data);
      }
      return base44.entities.TargetList.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetLists'] });
      setShowBuilder(false);
      setEditingList(null);
    },
  });

  // Delete target list
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.TargetList.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targetLists'] });
    },
  });

  // Export to CSV
  const handleExport = (targetList) => {
    const selectedContacts = contacts.filter(c => targetList.contact_ids?.includes(c.id));
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Address', 'Postcode', 'Support Level', 'Registered Voter', 'Tags'].join(','),
      ...selectedContacts.map(c => [
        `"${c.name || ''}"`,
        c.email || '',
        c.phone || '',
        `"${c.address || ''}"`,
        c.postcode || '',
        c.support_level || '',
        c.registered_voter ? 'Yes' : 'No',
        `"${(c.tags || []).join('; ')}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetList.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export to turf assignments
  const handleExportToTurfs = async (targetList) => {
    const selectedContacts = contacts.filter(c => targetList.contact_ids?.includes(c.id));
    
    // Group by turf
    const turfGroups = {};
    selectedContacts.forEach(c => {
      const turf = (c.tags || [])[0] || 'unassigned';
      if (!turfGroups[turf]) {
        turfGroups[turf] = [];
      }
      turfGroups[turf].push(c);
    });

    // Create turf assignment summary
    const summary = Object.entries(turfGroups).map(([turf, contactList]) => ({
      turf,
      count: contactList.length,
      contacts: contactList.map(c => `${c.name} (${c.address || 'no address'})`),
    }));

    // Export as structured JSON
    const json = {
      target_list: targetList.name,
      exported_at: new Date().toISOString(),
      total_contacts: selectedContacts.length,
      turfs: summary,
      contacts: selectedContacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        postcode: c.postcode,
        support_level: c.support_level,
        registered_voter: c.registered_voter,
        tags: c.tags,
      })),
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetList.name}-turf-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Target Lists</h1>
            <p className="text-sm text-muted-foreground mt-1">Segment and save contact groups for canvassing campaigns</p>
          </div>
          <Button 
            onClick={() => {
              setEditingList(null);
              setShowBuilder(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Target List
          </Button>
        </div>

        {/* Builder modal */}
        {showBuilder && (
          <TargetListBuilder 
            targetList={editingList}
            contacts={contacts}
            interactions={interactions}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => {
              setShowBuilder(false);
              setEditingList(null);
            }}
            isSaving={saveMutation.isPending}
          />
        )}

        {/* Preview modal */}
        {previewList && (
          <TargetListPreview 
            targetList={previewList}
            contacts={contacts.filter(c => previewList.contact_ids?.includes(c.id))}
            onClose={() => setPreviewList(null)}
            onExport={() => handleExport(previewList)}
            onExportTurfs={() => handleExportToTurfs(previewList)}
          />
        )}

        {/* Target Lists Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : targetLists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 gap-4">
              <p className="text-muted-foreground">No target lists created yet</p>
              <Button onClick={() => setShowBuilder(true)}>Create your first target list</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {targetLists.map((targetList) => (
              <Card key={targetList.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{targetList.name}</h3>
                      <Badge variant={targetList.is_active ? 'default' : 'secondary'}>
                        {targetList.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {targetList.description && (
                      <p className="text-sm text-muted-foreground">{targetList.description}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded">
                      <div className="text-2xl font-bold text-primary">{targetList.contact_count || 0}</div>
                      <div className="text-xs text-muted-foreground">contacts</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded">
                      <div className="text-lg font-semibold capitalize">{targetList.segment_type}</div>
                      <div className="text-xs text-muted-foreground">segment type</div>
                    </div>
                  </div>

                  {/* Filters summary */}
                  {targetList.filters && (
                    <div className="p-3 bg-muted/30 rounded text-xs space-y-1">
                      {targetList.filters.support_levels && (
                        <p><strong>Support:</strong> {targetList.filters.support_levels.join(', ')}</p>
                      )}
                      {targetList.filters.registered_voter !== undefined && (
                        <p><strong>Voters:</strong> {targetList.filters.registered_voter ? 'Registered only' : 'Non-registered only'}</p>
                      )}
                      {targetList.filters.turfs && (
                        <p><strong>Turfs:</strong> {targetList.filters.turfs.join(', ')}</p>
                      )}
                      {targetList.filters.tags && (
                        <p><strong>Tags:</strong> {targetList.filters.tags.join(', ')}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewList(targetList)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(targetList)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportToTurfs(targetList)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Turfs
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingList(targetList);
                        setShowBuilder(true);
                      }}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => {
                        if (confirm('Delete this target list?')) {
                          deleteMutation.mutate(targetList.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}