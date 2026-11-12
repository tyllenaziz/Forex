import type { Request, Response, NextFunction } from 'express';
import { Permission, ROLE_PERMISSIONS, Role } from './permissions.js';

export function requirePermission(perm: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role as Role | undefined;
    if (!role) return res.status(401).json({ error: 'unauthenticated' });
    if (!ROLE_PERMISSIONS[role]?.includes(perm))
      return res.status(403).json({ error: 'forbidden' });
    next();
  };
}