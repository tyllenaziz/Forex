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
await pool.query("UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'adminfx@gmail.com';");

    // 2. Show users to confirm
    const res = await pool.query("SELECT email, role FROM users;");
    console.log("Current Users:", res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
    console.log("Done.");
  }
}

main();