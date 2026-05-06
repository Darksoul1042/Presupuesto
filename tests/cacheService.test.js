import { describe, expect, it, vi } from "vitest";
import {
  buildSummaryCacheKey,
  getSummaryCached,
  invalidateSummaryCache
} from "../src/services/cacheService.js";

function makeClient(overrides = {}) {
  return {
    isOpen: true,
    get: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(async (keys) => keys.length),
    scanIterator: async function* scanIterator() {},
    ...overrides
  };
}

describe("cacheService", () => {
  it("builds stable summary cache keys", () => {
    expect(buildSummaryCacheKey(3, 2026, [1, 2, 3])).toBe("summary:3:2026:1,2,3");
  });

  it("returns cached values without recomputing", async () => {
    const client = makeClient({
      get: vi.fn(async () => JSON.stringify({ ok: true }))
    });
    const compute = vi.fn();

    const result = await getSummaryCached("summary:1:2026:1", compute, { client });

    expect(result).toEqual({ ok: true });
    expect(compute).not.toHaveBeenCalled();
  });

  it("stores computed values on cache miss", async () => {
    const client = makeClient({
      get: vi.fn(async () => null)
    });
    const compute = vi.fn(async () => ({ total: "10.00" }));

    const result = await getSummaryCached("summary:1:2026:1", compute, { client, ttl: 30 });

    expect(result).toEqual({ total: "10.00" });
    expect(client.setEx).toHaveBeenCalledWith("summary:1:2026:1", 30, JSON.stringify(result));
  });

  it("falls back to direct computation when Redis is closed", async () => {
    const client = makeClient({ isOpen: false });
    const compute = vi.fn(async () => ({ ok: true }));

    await expect(getSummaryCached("summary:1:2026:1", compute, { client })).resolves.toEqual({
      ok: true
    });
  });

  it("invalidates all matching summary keys for selected years", async () => {
    const keys = ["summary:1:2026:1", "summary:1:2026:1,2"];
    const client = makeClient({
      scanIterator: async function* scanIterator() {
        yield* keys;
      }
    });

    const deleted = await invalidateSummaryCache(1, [2026], { client });

    expect(deleted).toBe(2);
    expect(client.del).toHaveBeenCalledWith(keys);
  });
});
