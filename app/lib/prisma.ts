import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// Create a new database connection pool
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prevent Next.js from maxing out database connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pass the adapter securely into the PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}