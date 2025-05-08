import session from 'express-session';
import { getPool } from './db';
import connectPgSimple from 'connect-pg-simple';
import MemoryStore from 'memorystore';

// Create a memory store for sessions (as fallback)
const createMemoryStore = () => {
  console.log('Using memory store for sessions');
  return new (MemoryStore(session))({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
};

// Create a PostgreSQL store for sessions (when DATABASE_URL is provided)
const createPgStore = () => {
  try {
    console.log('Using PostgreSQL store for sessions');
    const pool = getPool();
    const PostgresStore = connectPgSimple(session);
    
    // Set error handler for the connection pool
    pool.on('error', (err) => {
      console.error('Unexpected error on PostgreSQL pool', err);
    });
    
    return new PostgresStore({
      pool,
      tableName: 'sessions', // Use a custom table name
      createTableIfMissing: false, // The table should already exist, don't try to recreate it
      errorLog: (err) => console.error('PostgreSQL session store error:', err)
    });
  } catch (error) {
    console.error('Failed to create PostgreSQL session store, falling back to memory store:', error);
    return createMemoryStore();
  }
};

// Unified function to create a session store
export const createSessionStore = (): session.Store => {
  // If we have a DATABASE_URL, use PostgreSQL for sessions
  if (process.env.DATABASE_URL) {
    try {
      return createPgStore();
    } catch (err) {
      console.error('Error creating PostgreSQL session store:', err);
      console.log('Falling back to memory session store');
      return createMemoryStore();
    }
  }
  
  // Default to memory store
  return createMemoryStore();
};

export default createSessionStore;