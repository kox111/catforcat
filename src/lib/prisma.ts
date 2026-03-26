import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// DEPLOY NOTE (Vercel + Supabase):
// When deploying to Vercel with Supabase, use the pooled connection string:
//   DATABASE_URL="postgresql://...@db.xxx.supabase.co:6543/postgres?pgbouncer=true&pool_timeout=20"
// The DIRECT_URL should use port 5432 for migrations:
//   DIRECT_URL="postgresql://...@db.xxx.supabase.co:5432/postgres"
// Add both to schema.prisma under datasource db { directUrl = env("DIRECT_URL") }
