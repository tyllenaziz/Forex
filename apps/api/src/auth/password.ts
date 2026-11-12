import argon2 from 'argon2';
import { env } from '../config/env.js';

export function hashPassword(pw: string) {
  return argon2.hash(pw + env.ARGON2_PEPPER, {
    type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
  });
}

export function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw + env.ARGON2_PEPPER);
}