import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolvePermissions, hasPermission } from '@/lib/permissions';

/**
 * Returns helpers to check the current user's permissions.
 *
 * can(permission)        — true/false single permission check
 * canAny([...])          — true if user has at least one of the listed permissions
 * canAll([...])          — true if user has ALL listed permissions
 * permissions            — the full Set of granted permission keys
 * isAdmin                — shortcut for role === 'admin'
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => resolvePermissions(user), [user]);

  const can = (permission) => permissions.has(permission);
  const canAny = (list) => list.some(p => permissions.has(p));
  const canAll = (list) => list.every(p => permissions.has(p));
  const isAdmin = user?.role === 'admin';

  return { can, canAny, canAll, permissions, isAdmin, user };
}