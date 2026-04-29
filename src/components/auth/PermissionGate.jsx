import { usePermissions } from '@/hooks/usePermissions';

/**
 * Conditionally renders children based on permissions.
 *
 * <PermissionGate permission="contacts_edit">  — single permission
 * <PermissionGate anyOf={['contacts_edit','contacts_create']}> — any
 * <PermissionGate allOf={['outreach_send','contacts_view']}> — all
 * <PermissionGate adminOnly> — only admins
 *
 * Renders `fallback` (default: null) when access is denied.
 */
export default function PermissionGate({ permission, anyOf, allOf, adminOnly, fallback = null, children }) {
  const { can, canAny, canAll, isAdmin } = usePermissions();

  let allowed = true;
  if (adminOnly) allowed = isAdmin;
  else if (allOf) allowed = canAll(allOf);
  else if (anyOf) allowed = canAny(anyOf);
  else if (permission) allowed = can(permission);

  return allowed ? children : fallback;
}