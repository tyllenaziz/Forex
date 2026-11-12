import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ADMIN_JWT_SECRET: z.string().min(16),
  ARGON2_PEPPER: z.string().min(16),
  BROKER_ENABLED: z.coerce.boolean().default(false),
  BINARY_OPTIONS_ENABLED: z.coerce.boolean().default(false),
  TWELVE_DATA_API_KEY: z.string().optional(), // <-- ADD THIS
});

export const env = EnvSchema.parse(process.env);