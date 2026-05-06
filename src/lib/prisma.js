import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__presupuestoPrisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.__presupuestoPrisma = prisma;
}

export default prisma;
