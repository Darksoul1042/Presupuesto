import { Prisma } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/prisma.js", () => ({
  default: {
    department: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    monthlyBudget: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      upsert: vi.fn()
    },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn()
    },
    $queryRaw: vi.fn()
  }
}));

vi.mock("../src/lib/redis.js", () => ({
  getRedisClient: vi.fn(async () => null),
  getRedisStatus: vi.fn(() => ({
    enabled: false,
    status: "disabled",
    error: null
  }))
}));

const { default: prisma } = await import("../src/lib/prisma.js");
const { default: app } = await import("../src/app.js");

const now = new Date("2026-01-01T00:00:00.000Z");
const d = (value) => new Prisma.Decimal(value);

function transaction(overrides = {}) {
  return {
    id: 1,
    departmentId: 1,
    type: "EXPENSE",
    amount: d("10.00"),
    year: 2026,
    month: 1,
    fromYear: null,
    fromMonth: null,
    toYear: null,
    toMonth: null,
    description: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

describe("Presupuesto API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates departments", async () => {
    prisma.department.create.mockResolvedValue({
      id: 1,
      name: "Finance",
      createdAt: now,
      updatedAt: now
    });

    const response = await request(app).post("/departments").send({ name: "Finance" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      id: 1,
      name: "Finance"
    });
  });

  it("creates expense transactions and serializes money", async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1 });
    prisma.transaction.create.mockResolvedValue(
      transaction({
        amount: d("120.50"),
        description: "Cloud services"
      })
    );

    const response = await request(app).post("/transactions/expense").send({
      departmentId: 1,
      year: 2026,
      month: 1,
      amount: "120.50",
      description: "Cloud services"
    });

    expect(response.status).toBe(201);
    expect(response.body.data.amount).toBe("120.50");
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "EXPENSE",
          year: 2026,
          month: 1
        })
      })
    );
  });

  it("paginates transactions with cursor-based metadata", async () => {
    prisma.transaction.findMany.mockResolvedValue([
      transaction({ id: 10 }),
      transaction({ id: 9 }),
      transaction({ id: 8 })
    ]);

    const response = await request(app).get("/transactions?departmentId=1&year=2026&month=1&limit=2");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      limit: 2,
      nextCursor: 9
    });
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: { id: "desc" }
      })
    );
  });

  it("returns partial monthly summaries with database aggregations", async () => {
    prisma.department.findUnique.mockResolvedValue({ id: 1 });
    prisma.monthlyBudget.groupBy.mockResolvedValue([
      { month: 1, _sum: { amount: d("1000.00") } },
      { month: 2, _sum: { amount: d("2000.00") } }
    ]);
    prisma.transaction.groupBy
      .mockResolvedValueOnce([{ month: 1, _sum: { amount: d("100.00") } }])
      .mockResolvedValueOnce([{ fromMonth: 2, _sum: { amount: d("50.00") } }])
      .mockResolvedValueOnce([{ toMonth: 1, _sum: { amount: d("25.00") } }]);

    const response = await request(app).get("/summary?departmentId=1&year=2026&months=2,1,1");

    expect(response.status).toBe(200);
    expect(response.body.data.months).toEqual([
      {
        month: 1,
        initial: "1000.00",
        expenses: "100.00",
        transferredOut: "0.00",
        transferredIn: "25.00",
        available: "925.00"
      },
      {
        month: 2,
        initial: "2000.00",
        expenses: "0.00",
        transferredOut: "50.00",
        transferredIn: "0.00",
        available: "1950.00"
      }
    ]);
  });

  it("rejects invalid summary month lists", async () => {
    const response = await request(app).get("/summary?departmentId=1&year=2026&months=1,abc");

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Validation failed");
  });
});
