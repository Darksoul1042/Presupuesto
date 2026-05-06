import dotenv from "dotenv";

dotenv.config();

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: numberFromEnv("PORT", 4000),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  SUMMARY_CACHE_TTL_SECONDS: numberFromEnv("SUMMARY_CACHE_TTL_SECONDS", 60)
};

export const isTest = env.NODE_ENV === "test";
