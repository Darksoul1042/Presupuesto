import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import { closeRedis } from "./lib/redis.js";

const server = app.listen(env.PORT, () => {
  console.log(`Presupuesto API listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down Presupuesto API...`);

  server.close(async () => {
    await Promise.allSettled([prisma.$disconnect(), closeRedis()]);
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
