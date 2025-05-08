require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

/**
 * Remove the hasVariants field from the products table
 */
async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('Running migration to remove hasVariants field from products table...');

  try {
    // Use direct SQL to alter the table as Drizzle ORM doesn't support dropping columns out of the box
    await pool.query(`
      ALTER TABLE products 
      DROP COLUMN IF EXISTS has_variants
    `);

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();