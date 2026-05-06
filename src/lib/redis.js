import { createClient } from "redis";
import { env } from "../config/env.js";

let clientPromise;
let status = "idle";
let lastError = null;

export async function getRedisClient() {
  if (!env.REDIS_URL) {
    status = "disabled";
    return null;
  }

  if (clientPromise) return clientPromise;

  status = "connecting";
  const client = createClient({ url: env.REDIS_URL });

  client.on("ready", () => {
    status = "ready";
    lastError = null;
  });

  client.on("error", (error) => {
    status = "error";
    lastError = error;
  });

  client.on("end", () => {
    status = "closed";
  });

  clientPromise = client
    .connect()
    .then(() => client)
    .catch((error) => {
      status = "error";
      lastError = error;
      clientPromise = null;
      return null;
    });

  return clientPromise;
}

export function getRedisStatus() {
  if (!env.REDIS_URL) {
    return {
      enabled: false,
      status: "disabled",
      error: null
    };
  }

  return {
    enabled: true,
    status,
    error: lastError?.message ?? null
  };
}

export async function closeRedis() {
  const client = clientPromise ? await clientPromise : null;

  if (client?.isOpen) {
    await client.quit();
  }

  clientPromise = null;
  status = "closed";
}
