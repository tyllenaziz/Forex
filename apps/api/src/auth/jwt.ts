import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../rbac/permissions.js';

export interface TokenPayload { sub: string; role: Role; }

export function signAccess(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

export function signRefresh(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccess(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}