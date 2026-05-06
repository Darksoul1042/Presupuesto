import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";
import { closeRedis } from "./lib/redis.js";

const server = app.listen(env.PORT, () => {
  console.log(`Presupuesto app listening at http://localhost:${env.PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.PORT} is already in use. Open http://localhost:${env.PORT} or stop the existing process.`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
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
