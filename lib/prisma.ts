import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "";
  const adapter = new PrismaPg({ connectionString: url });

  if (url.startsWith("prisma+postgres://")) {
    // Prisma Accelerate — route through the Accelerate proxy with caching extension.
    // The prisma+postgres:// URL is handled by the Accelerate layer transparently.
    return new PrismaClient({ adapter }).$extends(
      withAccelerate(),
    ) as unknown as PrismaClient;
  }

  // Direct PostgreSQL via pg driver adapter
  return new PrismaClient({ adapter });
}

// Cache client on `global` in development to survive hot-module reloads.
// In production, module caching is sufficient — a new module is never hot-reloaded.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
