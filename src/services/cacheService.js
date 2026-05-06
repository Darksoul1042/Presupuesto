import { env } from "../config/env.js";
import { getRedisClient } from "../lib/redis.js";

export function buildSummaryCacheKey(departmentId, year, months) {
  return `summary:${departmentId}:${year}:${months.join(",")}`;
}

export async function getSummaryCached(key, computeFn, options = {}) {
  const ttl = options.ttl ?? env.SUMMARY_CACHE_TTL_SECONDS;
  const client = options.client ?? (await getRedisClient());

  if (!client?.isOpen) {
    return computeFn();
  }

  try {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    return computeFn();
  }

  const result = await computeFn();

  try {
    await client.setEx(key, ttl, JSON.stringify(result));
  } catch {
    return result;
  }

  return result;
}

export async function invalidateSummaryCache(departmentId, years = [], options = {}) {
  const client = options.client ?? (await getRedisClient());

  if (!client?.isOpen) {
    return 0;
  }

  const normalizedYears = [...new Set(years.filter(Boolean))];
  const patterns =
    normalizedYears.length > 0
      ? normalizedYears.map((year) => `summary:${departmentId}:${year}:*`)
      : [`summary:${departmentId}:*`];

  try {
    let deleted = 0;

    for (const pattern of patterns) {
      const keys = [];

      for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key);
      }

      if (keys.length > 0) {
        deleted += await client.del(keys);
      }
    }

    return deleted;
  } catch {
    return 0;
  }
}
