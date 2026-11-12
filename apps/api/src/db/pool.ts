import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  ssl: env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false,
});