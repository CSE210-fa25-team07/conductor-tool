/**
 * Database seeding script for Render deployment.
 * Runs all SQL migrations in order against the production database.
 *
 * Usage: node scripts/seed-db.js
 *
 * Requires DATABASE_URL environment variable to be set.
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../database/migrations");

/**
 * Cleans SQL content by removing psql-specific commands
 * that don't work with the Node.js pg client.
 */
function cleanSql(sql) {
  return sql
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();
      // Skip psql meta-commands
      if (trimmed.startsWith("\\c ")) return false;
      if (trimmed.startsWith("\\gexec")) return false;
      // Skip database creation (Render provides the database)
      if (trimmed.includes("CREATE DATABASE")) return false;
      if (trimmed.includes("pg_database")) return false;
      return true;
    })
    .join("\n");
}

async function seedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Required for Render's managed Postgres
  });

  try {
    await client.connect();

    // Enable pgcrypto extension (needed for gen_random_uuid)
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

    // Get all SQL files sorted by name, skip 001 (database creation)
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql") && !f.startsWith("001"))
      .sort();

    for (const file of files) {
      const rawSql = readFileSync(join(migrationsDir, file), "utf8");
      const cleanedSql = cleanSql(rawSql);
      await client.query(cleanedSql);
    }
  } catch (error) {
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
