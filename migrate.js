// Script to add new columns to vendors table
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon Serverless
neonConfig.webSocketConstructor = ws;

// Configure for Neon serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Add color_palette column if not exists
    await client.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS color_palette text DEFAULT 'default'
    `);
    console.log('Added color_palette column');
    
    // Add font_settings column if not exists
    await client.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS font_settings jsonb
    `);
    console.log('Added font_settings column');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    // Release client
    client.release();
    // Close pool
    await pool.end();
    process.exit(0);
  }
}

// Run migration
console.log('Running migration to add new columns to vendors table...');
runMigration();