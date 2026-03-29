import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// DEPLOY: Coolify on Hetzner (ROMA). PostgreSQL runs as a separate service.
// POSTGRES_URL is set in Coolify's environment variables.
