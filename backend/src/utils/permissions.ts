import { Permission, UserRole } from '../types/index.js';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'tasks:read',
    'tasks:write',
    'tasks:delete',
    'users:read',
    'users:write',
    'logs:read',
    'analytics:read',
    'agents:read',
    'agents:write',
  ],
  user: [
    'tasks:read',
    'tasks:write',
    'agents:read',
  ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

export default ROLE_PERMISSIONS;
