import prisma from "../lib/prisma.js";
import { decimalToString, toDecimal, zeroDecimal } from "../utils/money.js";
import { buildSummaryCacheKey, getSummaryCached } from "./cacheService.js";
import { ensureDepartmentExists } from "./departmentService.js";

export async function getMonthlySummary({ departmentId, year, months }) {
  const normalizedMonths = normalizeMonths(months);

  await ensureDepartmentExists(departmentId);

  return getSummaryCached(buildSummaryCacheKey(departmentId, year, normalizedMonths), () =>
    computeMonthlySummary({ departmentId, year, months: normalizedMonths })
  );
}

export async function computeMonthlySummary({ departmentId, year, months }, db = prisma) {
  const normalizedMonths = normalizeMonths(months);

  const [budgets, expenses, transfersOut, transfersIn] = await Promise.all([
    db.monthlyBudget.groupBy({
      by: ["month"],
      where: {
        departmentId,
        year,
        month: {
          in: normalizedMonths
        }
      },
      _sum: {
        amount: true
      }
    }),
    db.transaction.groupBy({
      by: ["month"],
      where: {
        departmentId,
        type: "EXPENSE",
        year,
        month: {
          in: normalizedMonths
        }
      },
      _sum: {
        amount: true
      }
    }),
    db.transaction.groupBy({
      by: ["fromMonth"],
      where: {
        departmentId,
        type: "TRANSFER",
        fromYear: year,
        fromMonth: {
          in: normalizedMonths
        }
      },
      _sum: {
        amount: true
      }
    }),
    db.transaction.groupBy({
      by: ["toMonth"],
      where: {
        departmentId,
        type: "TRANSFER",
        toYear: year,
        toMonth: {
          in: normalizedMonths
        }
      },
      _sum: {
        amount: true
      }
    })
  ]);

  const budgetByMonth = mapSumsBy(budgets, "month");
  const expensesByMonth = mapSumsBy(expenses, "month");
  const transfersOutByMonth = mapSumsBy(transfersOut, "fromMonth");
  const transfersInByMonth = mapSumsBy(transfersIn, "toMonth");

  return {
    departmentId,
    year,
    months: normalizedMonths.map((month) => {
      const initial = budgetByMonth.get(month) ?? zeroDecimal();
      const expenseTotal = expensesByMonth.get(month) ?? zeroDecimal();
      const transferredOut = transfersOutByMonth.get(month) ?? zeroDecimal();
      const transferredIn = transfersInByMonth.get(month) ?? zeroDecimal();
      const available = initial.plus(transferredIn).minus(transferredOut).minus(expenseTotal);

      return {
        month,
        initial: decimalToString(initial),
        expenses: decimalToString(expenseTotal),
        transferredOut: decimalToString(transferredOut),
        transferredIn: decimalToString(transferredIn),
        available: decimalToString(available)
      };
    })
  };
}

function normalizeMonths(months) {
  return [...new Set(months)].sort((a, b) => a - b);
}

function mapSumsBy(rows, key) {
  const values = new Map();

  for (const row of rows) {
    const month = row[key];
    if (month !== null && month !== undefined) {
      values.set(month, toDecimal(row._sum.amount ?? 0));
    }
  }

  return values;
}
