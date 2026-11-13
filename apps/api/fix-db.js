import pg from 'pg';

// PASTE YOUR CORRECT EXTERNAL DATABASE URL BELOW
const connectionString = "postgresql://platform:osLBIBpRilAvdcFZqFnH2UqPnP54hxGy@dpg-dbr0chgae00c73bgl2e0-a.oregon-postgres.render.com/platform_2jwx?sslmode=require";

const pool = new pg.Pool({ 
  connectionString, 
  ssl: { rejectUnauthorized: false } 
});

async function main() {
  try {
    console.log("Connecting to Render database...");

    // 1. Fix the country column
    await pool.query("ALTER TABLE users ALTER COLUMN country TYPE VARCHAR(50);");
    console.log("✅ Country column updated");

    // 2. Add missing order columns
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS digit_prediction VARCHAR(10);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 60;");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_tp DECIMAL(10,2);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_sl DECIMAL(10,2);");
    console.log("✅ Order columns added");

    // 3. Add trading_paused column to users
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_paused BOOLEAN DEFAULT false;");
    console.log("✅ User trading_paused column added");

    // 4. Ensure payment_intents table exists with correct columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        kind TEXT NOT NULL CHECK (kind IN ('DEPOSIT', 'WITHDRAWAL')),
        status TEXT NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','CONFIRMED','FAILED','REVERSED','REJECTED')),
        amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
        currency CHAR(3) NOT NULL,
        provider TEXT NOT NULL,
        provider_ref TEXT,
        details JSONB DEFAULT '{}',
        account_mode VARCHAR(10) DEFAULT 'DEMO',
        idempotency_key TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("✅ payment_intents table verified");

    // 5. Add missing columns if table already existed without them
    await pool.query("ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';");
    await pool.query("ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS account_mode VARCHAR(10) DEFAULT 'DEMO';");
    console.log("✅ payment_intents missing columns added");

    // 6. Update constraint to allow REJECTED status
    try {
      await pool.query("ALTER TABLE payment_intents DROP CONSTRAINT IF EXISTS payment_intents_status_check;");
      await pool.query("ALTER TABLE payment_intents ADD CONSTRAINT payment_intents_status_check CHECK (status IN ('PENDING','CONFIRMED','FAILED','REVERSED','REJECTED'));");
      console.log("✅ payment_intents status constraint updated");
    } catch (e) {
      console.log("⚠️ Status constraint already correct or cannot be changed");
    }

    // 7. Promote admin user
    await pool.query("UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'adminfx@gmail.com';");
    console.log("✅ Admin user promoted");

    // 8. Verify users
    const users = await pool.query("SELECT email, role, kyc_status FROM users;");
    console.log("Current Users:", users.rows);

    // 9. Verify orders columns
    const orderCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' ORDER BY ordinal_position;
    `);
    console.log("Orders columns:", orderCols.rows.map(c => c.column_name).join(', '));

    // 10. Verify payment_intents columns
    const piCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'payment_intents' ORDER BY ordinal_position;
    `);
    console.log("payment_intents columns:", piCols.rows.map(c => c.column_name).join(', '));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
    console.log("Done.");
  }
}

main();