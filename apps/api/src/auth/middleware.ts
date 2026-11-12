import type { Request, Response, NextFunction } from 'express';
import { verifyAccess } from './jwt.js';

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }
  try {
    (req as any).user = verifyAccess(token);
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}