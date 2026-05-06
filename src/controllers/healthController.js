import prisma from "../lib/prisma.js";
import { getRedisClient, getRedisStatus } from "../lib/redis.js";

export async function getHealthController(req, res) {
  const database = await getDatabaseHealth();
  const redis = await getRedisHealth();
  const healthy = database.status === "up";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database,
    redis
  });
}

async function getDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "up"
    };
  } catch (error) {
    return {
      status: "down",
      error: error.message
    };
  }
}

async function getRedisHealth() {
  const before = getRedisStatus();

  if (!before.enabled) {
    return before;
  }

  try {
    const client = await getRedisClient();
    if (client?.isOpen) {
      await client.ping();
    }
  } catch {
    return getRedisStatus();
  }

  return getRedisStatus();
}
