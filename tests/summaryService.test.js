import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { computeMonthlySummary } from "../src/services/summaryService.js";

const d = (value) => new Prisma.Decimal(value);

function makeDb({ budgets = [], expenses = [], transfersOut = [], transfersIn = [] } = {}) {
  return {
    monthlyBudget: {
      groupBy: vi.fn().mockResolvedValue(budgets)
    },
    transaction: {
      groupBy: vi
        .fn()
        .mockResolvedValueOnce(expenses)
        .mockResolvedValueOnce(transfersOut)
        .mockResolvedValueOnce(transfersIn)
    }
  };
}

describe("computeMonthlySummary", () => {
  it("calculates a month with initial budget and expenses", async () => {
    const db = makeDb({
      budgets: [{ month: 1, _sum: { amount: d("1000.00") } }],
      expenses: [{ month: 1, _sum: { amount: d("125.50") } }]
    });

    const summary = await computeMonthlySummary({ departmentId: 1, year: 2026, months: [1] }, db);

    expect(summary.months[0]).toEqual({
      month: 1,
      initial: "1000.00",
      expenses: "125.50",
      transferredOut: "0.00",
      transferredIn: "0.00",
      available: "874.50"
    });
  });

  it("separates sent and received transfers", async () => {
    const db = makeDb({
      budgets: [{ month: 3, _sum: { amount: d("500.00") } }],
      expenses: [{ month: 3, _sum: { amount: d("50.00") } }],
      transfersOut: [{ fromMonth: 3, _sum: { amount: d("100.00") } }],
      transfersIn: [{ toMonth: 3, _sum: { amount: d("25.00") } }]
    });

    const summary = await computeMonthlySummary({ departmentId: 1, year: 2026, months: [3] }, db);

    expect(summary.months[0]).toMatchObject({
      initial: "500.00",
      expenses: "50.00",
      transferredOut: "100.00",
      transferredIn: "25.00",
      available: "375.00"
    });
  });

  it("returns zeroed months when no records exist", async () => {
    const summary = await computeMonthlySummary(
      { departmentId: 1, year: 2026, months: [4] },
      makeDb()
    );

    expect(summary.months[0]).toEqual({
      month: 4,
      initial: "0.00",
      expenses: "0.00",
      transferredOut: "0.00",
      transferredIn: "0.00",
      available: "0.00"
    });
  });

  it("counts cross-year transfers in the destination year", async () => {
    const db = makeDb({
      budgets: [{ month: 1, _sum: { amount: d("300.00") } }],
      transfersIn: [{ toMonth: 1, _sum: { amount: d("75.00") } }]
    });

    const summary = await computeMonthlySummary({ departmentId: 1, year: 2027, months: [1] }, db);

    expect(summary.months[0]).toMatchObject({
      initial: "300.00",
      transferredIn: "75.00",
      available: "375.00"
    });
  });
});
