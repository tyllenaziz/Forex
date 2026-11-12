import fs from 'node:fs';
import path from 'node:path';
import { pool } from './pool.js';

async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT now()
  )`);

  const dir = path.resolve('migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const { rows } = await pool.query('SELECT name FROM _migrations');
  const applied = new Set(rows.map(r => r.name));

  for (const f of files) {
    if (applied.has(f)) continue;
    console.log(`Applying ${f}...`);
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [f]);
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  }
  console.log('Migrations complete');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });