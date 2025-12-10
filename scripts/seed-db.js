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

async function seedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    console.log("Connecting to database...");
    await client.connect();

    // Get all SQL files sorted by name
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      await client.query(sql);
      console.log(`Completed: ${file}`);
    }

    console.log("\nDatabase seeding completed successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
