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

    // 1. Fix the country column (was CHAR(2), needs to be VARCHAR(50) for "Kenya")
    await pool.query("ALTER TABLE users ALTER COLUMN country TYPE VARCHAR(50);");
    console.log("✅ Country column updated");

    // 2. Add all missing order columns
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS digit_prediction VARCHAR(10);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 60;");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_tp DECIMAL(10,2);");
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_sl DECIMAL(10,2);");
    console.log("✅ Order columns added");

    // 3. Add trading_paused column to users
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS trading_paused BOOLEAN DEFAULT false;");
    console.log("✅ User trading_paused column added");

    // 4. Promote admin user
    await pool.query("UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'adminfx@gmail.com';");
    console.log("✅ Admin user promoted");

    // 5. Verify
    const res = await pool.query("SELECT email, role, kyc_status FROM users;");
    console.log("Current Users:", res.rows);

    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);
    console.log("Orders table columns:", cols.rows.map(c => c.column_name).join(', '));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
    console.log("Done.");
  }
}

main();