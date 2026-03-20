import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/config";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaAdapter: PrismaPg | undefined;
}

const adapter = globalThis.prismaAdapter ?? new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaAdapter = adapter;
  globalThis.prisma = prisma;
}
