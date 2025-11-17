/**
 * Database Connection Utility
 *
 * Provides PostgreSQL connection pool using the pg library.
 * Loads connection configuration from environment variables.
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 * Reads from DATABASE_URL or individual env variables
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Individual connection params (fallback)
  host: process.env.POSTGRES_HOST || "localhost",
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || "conductor",
  user: process.env.POSTGRES_USER || "conductor_user",
  password: process.env.POSTGRES_PASSWORD || "conductor_pass",
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client can be idle before being closed
  connectionTimeoutMillis: 2000 // how long to wait for a connection
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>} Query result
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * Remember to call client.release() when done
 * @returns {Promise<pg.PoolClient>} Database client
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const result = await query("SELECT NOW()");
    console.log("Database connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Close all connections in the pool
 * Call this when shutting down the application
 */
export async function closePool() {
  await pool.end();
  console.log("Database pool closed");
}

export default {
  query,
  getClient,
  testConnection,
  closePool
};
