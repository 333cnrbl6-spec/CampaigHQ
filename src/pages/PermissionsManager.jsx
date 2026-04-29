import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS, ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_DEFAULTS, resolvePermissions } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, ChevronDown, ChevronUp, Save, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Group permissions for display
const PERMISSION_GROUPS = [
  {
    label: 'Contacts',
    perms: [
      PERMISSIONS.CONTACTS_VIEW, PERMISSIONS.CONTACTS_CREATE, PERMISSIONS.CONTACTS_EDIT,
      PERMISSIONS.CONTACTS_DELETE, PERMISSIONS.CONTACTS_BULK_TAG, PERMISSIONS.CONTACTS_IMPORT,
    ],
  },
  {
    label: 'Field & Canvassing',
    perms: [PERMISSIONS.FIELD_MODE, PERMISSIONS.LOG_INTERACTIONS, PERMISSIONS.CANVASSING_SCRIPTS],
  },
  {
    label: 'Events & Volunteers',
    perms: [
      PERMISSIONS.EVENTS_VIEW, PERMISSIONS.EVENTS_MANAGE, PERMISSIONS.VOLUNTEERS_VIEW,
      PERMISSIONS.VOLUNTEERS_MANAGE, PERMISSIONS.SHIFTS_MANAGE,
    ],
  },
  {
    label: 'Maps & Routes',
    perms: [PERMISSIONS.MAP_VIEW, PERMISSIONS.TURF_MANAGE, PERMISSIONS.LEAFLETS_MANAGE, PERMISSIONS.ROUTE_OPTIMIZER],
  },
  {
    label: 'Outreach & Comms',
    perms: [PERMISSIONS.OUTREACH_SEND, PERMISSIONS.OUTREACH_AUTOMATION, PERMISSIONS.TEAM_CHAT, PERMISSIONS.SOCIAL_MEDIA],
  },
  {
    label: 'Admin',
    perms: [
      PERMISSIONS.REPORTS_VIEW, PERMISSIONS.TASKS_MANAGE, PERMISSIONS.ISSUES_MANAGE,
      PERMISSIONS.MATERIALS_VIEW, PERMISSIONS.DATA_IMPORT, PERMISSIONS.GOTV_VIEW,
      PERMISSIONS.USERS_MANAGE, PERMISSIONS.ELECTION_DAY,
    ],
  },
];

const PERM_LABELS = {
  contacts_view: 'View Contacts', contacts_create: 'Create Contacts', contacts_edit: 'Edit Contacts',
  contacts_delete: 'Delete Contacts', contacts_bulk_tag: 'Bulk Tag', contacts_import: 'Import Contacts',
  field_mode: 'Field Mode', log_interactions: 'Log Interactions', canvassing_scripts: 'Canvassing Scripts',
  events_view: 'View Events', events_manage: 'Manage Events', volunteers_view: 'View Volunteers',
  volunteers_manage: 'Manage Volunteers', shifts_manage: 'Manage Shifts',
  map_view: 'View Map', turf_manage: 'Manage Turfs', leaflets_manage: 'Manage Leaflets', route_optimizer: 'Route Optimizer',
  outreach_send: 'Send Outreach', outreach_automation: 'Outreach Automation', team_chat: 'Team Chat', social_media: 'Social Media',
  reports_view: 'View Reports', tasks_manage: 'Manage Tasks', issues_manage: 'Manage Issues',
  materials_view: 'View Materials', data_import: 'Import Data', gotv_view: 'GOTV Tracker',
  users_manage: 'Manage Users', election_day: 'Election Day',
};

// Resolve role defaults as a Set
function roleDefaultSet(role) {
  const defaults = {
    admin: Object.values(PERMISSIONS),
    organizer: [
      PERMISSIONS.CONTACTS_VIEW, PERMISSIONS.CONTACTS_CREATE, PERMISSIONS.CONTACTS_EDIT,
      PERMISSIONS.CONTACTS_BULK_TAG, PERMISSIONS.CONTACTS_IMPORT, PERMISSIONS.FIELD_MODE,
      PERMISSIONS.LOG_INTERACTIONS, PERMISSIONS.CANVASSING_SCRIPTS, PERMISSIONS.EVENTS_VIEW,
      PERMISSIONS.EVENTS_MANAGE, PERMISSIONS.VOLUNTEERS_VIEW, PERMISSIONS.VOLUNTEERS_MANAGE,
      PERMISSIONS.SHIFTS_MANAGE, PERMISSIONS.MAP_VIEW, PERMISSIONS.TURF_MANAGE, PERMISSIONS.LEAFLETS_MANAGE,
      PERMISSIONS.ROUTE_OPTIMIZER, PERMISSIONS.OUTREACH_SEND, PERMISSIONS.OUTREACH_AUTOMATION,
      PERMISSIONS.TEAM_CHAT, PERMISSIONS.SOCIAL_MEDIA, PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.TASKS_MANAGE, PERMISSIONS.ISSUES_MANAGE, PERMISSIONS.MATERIALS_VIEW,
      PERMISSIONS.DATA_IMPORT, PERMISSIONS.GOTV_VIEW, PERMISSIONS.ELECTION_DAY,
    ],
    canvasser: [
      PERMISSIONS.CONTACTS_VIEW, PERMISSIONS.CONTACTS_EDIT, PERMISSIONS.FIELD_MODE,
      PERMISSIONS.LOG_INTERACTIONS, PERMISSIONS.CANVASSING_SCRIPTS, PERMISSIONS.MAP_VIEW,
      PERMISSIONS.TEAM_CHAT, PERMISSIONS.EVENTS_VIEW, PERMISSIONS.VOLUNTEERS_VIEW,
      PERMISSIONS.MATERIALS_VIEW, PERMISSIONS.GOTV_VIEW,
    ],
    viewer: [
      PERMISSIONS.CONTACTS_VIEW, PERMISSIONS.EVENTS_VIEW, PERMISSIONS.VOLUNTEERS_VIEW,
      PERMISSIONS.MAP_VIEW, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.GOTV_VIEW,
      PERMISSIONS.MATERIALS_VIEW, PERMISSIONS.TEAM_CHAT,
    ],
  };
  return new Set(defaults[role] || defaults.viewer);
}

function UserRow({ user, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [role, setRole] = useState(user.role || 'viewer');
  const [overrides, setOverrides] = useState(() => {
    // compute current effective permissions from stored data
    const grants = new Set(user.custom_permissions || []);
    const revokes = new Set(user.revoked_permissions || []);
    return { grants, revokes };
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const defaults = roleDefaultSet(role);
  const effective = new Set(defaults);
  overrides.grants.forEach(p => effective.add(p));
  overrides.revokes.forEach(p => effective.delete(p));

  const togglePerm = (perm) => {
    const isOn = effective.has(perm);
    const isDefault = defaults.has(perm);
    setOverrides(prev => {
      const grants = new Set(prev.grants);
      const revokes = new Set(prev.revokes);
      if (isOn) {
        // turning off
        revokes.add(perm);
        grants.delete(perm);
      } else {
        // turning on
        grants.add(perm);
        revokes.delete(perm);
      }
      // If back to default, remove overrides
      if (isDefault && !isOn) { grants.delete(perm); revokes.delete(perm); }
      if (!isDefault && isOn) { grants.delete(perm); revokes.delete(perm); }
      return { grants, revokes };
    });
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setOverrides({ grants: new Set(), revokes: new Set() }); // reset overrides on role change
  };

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe ? null : null; // no-op guard
    await base44.entities.User.update(user.id, {
      role,
      custom_permissions: [...overrides.grants],
      revoked_permissions: [...overrides.revokes],
    });
    setSaving(false);
    toast({ title: 'Saved', description: `${user.full_name}'s permissions updated.` });
    onSaved();
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{user.full_name || user.email}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Badge variant="outline" className="capitalize flex-shrink-0">{ROLE_LABELS[role] || role}</Badge>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {/* Role selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-16 flex-shrink-0">Role</label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>

          {/* Permission toggles */}
          <div className="space-y-3">
            {PERMISSION_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {group.perms.map(perm => {
                    const isOn = effective.has(perm);
                    const isDefault = defaults.has(perm);
                    const isOverridden = (isOn && !isDefault) || (!isOn && isDefault);
                    return (
                      <div key={perm} className="flex items-center gap-2">
                        <Switch checked={isOn} onCheckedChange={() => togglePerm(perm)} />
                        <span className="text-sm">{PERM_LABELS[perm] || perm}</span>
                        {isOverridden && (
                          <span className="text-[10px] font-medium text-accent-foreground bg-accent px-1.5 py-0.5 rounded">custom</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving} size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PermissionsManager() {
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="p-10 text-center">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-muted-foreground text-sm">Only administrators can manage permissions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Permissions Manager</h1>
        </div>
        <p className="text-muted-foreground">Assign roles and customise individual permissions for each team member.</p>
      </div>

      {/* Role reference */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <Card key={key} className="border border-border/50">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : (
          users.map(u => (
            <UserRow
              key={u.id}
              user={u}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['users-all'] })}
            />
          ))
        )}
      </div>
    </div>
  );
}