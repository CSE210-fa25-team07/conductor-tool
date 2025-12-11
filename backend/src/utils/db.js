/**
 * Database connection configuration using Prisma ORM
 * @module database/db
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

/**
 * Prisma Client instance
 * @type {PrismaClient}
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT NOW()`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
export async function closeConnection() {
  await prisma.$disconnect();
}

/**
 * Get Prisma Client instance
 * Use this to access all Prisma models and queries
 * @example
 * import { getPrisma } from "./db.js";
 * const prisma = getPrisma();
 * const users = await prisma.user.findMany();
 * @returns {PrismaClient} Prisma client instance
 */
export function getPrisma() {
  return prisma;
}

export default prisma;
