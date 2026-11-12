import { Router } from 'express';
import { tx } from '../db/tx.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { signAccess, signRefresh } from '../auth/jwt.js';
import { RegisterSchema, LoginSchema } from '@platform/shared-types';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { fullName, email, phone, country, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await tx(async (db) => {
      const u = await db.query(
        `INSERT INTO users (full_name, email, phone, country, password_hash)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role`,
        [fullName, email, phone, country, passwordHash]
      );
      const userId = u.rows[0].id;
      
      // Create ledger accounts for the user
            // Create BOTH Demo and Real ledger accounts for the user
      const accounts = ['USER_AVAILABLE', 'USER_PENDING_DEP', 'USER_PENDING_WD'];
      for (const acc of accounts) {
        // Real Account
        await db.query(
          `INSERT INTO ledger_accounts (code, type, currency, user_id)
           VALUES ($1, 'LIABILITY', 'USD', $2)`,
          [`REAL:${acc}:${userId}`, userId]
        );
        // Demo Account
        await db.query(
          `INSERT INTO ledger_accounts (code, type, currency, user_id)
           VALUES ($1, 'LIABILITY', 'USD', $2)`,
          [`DEMO:${acc}:${userId}`, userId]
        );
      }
      return u.rows[0];
    });

    res.status(201).json({ message: 'User registered', user });
     } catch (err: any) {
    // Handle Postgres unique constraint (Email already exists)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This email address is already registered.' });
    }
    
    // Handle Zod validation errors (arrays of issues)
    if (Array.isArray(err)) {
       return res.status(400).json({ error: err.map((e: any) => e.message).join(', ') });
    }
    
    // Handle ZodError object
    if (err.name === 'ZodError') {
       return res.status(400).json({ error: err.issues.map((e: any) => e.message).join(', ') });
    }

    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { email, password } = parsed.data;

  const result = await tx(async (db) => {
    return db.query(`SELECT id, password_hash, role FROM users WHERE email = $1`, [email]);
  });

  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  // IMPORTANT: Ensure the payload includes the role from the database
  const payload = { sub: user.id, role: user.role };

  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  res.json({ accessToken, refreshToken, role: user.role });
});