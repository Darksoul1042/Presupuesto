import prisma from "../lib/prisma.js";
import { ensureDepartmentExists } from "./departmentService.js";
import { invalidateSummaryCache } from "./cacheService.js";

export async function createExpense(data) {
  await ensureDepartmentExists(data.departmentId);

  const transaction = await prisma.transaction.create({
    data: {
      departmentId: data.departmentId,
      type: "EXPENSE",
      amount: data.amount,
      year: data.year,
      month: data.month,
      description: data.description
    }
  });

  await invalidateSummaryCache(data.departmentId, [data.year]);

  return transaction;
}

export async function createTransfer(data) {
  await ensureDepartmentExists(data.departmentId);

  const transaction = await prisma.transaction.create({
    data: {
      departmentId: data.departmentId,
      type: "TRANSFER",
      amount: data.amount,
      fromYear: data.fromYear,
      fromMonth: data.fromMonth,
      toYear: data.toYear,
      toMonth: data.toMonth,
      description: data.description
    }
  });

  await invalidateSummaryCache(data.departmentId, [data.fromYear, data.toYear]);

  return transaction;
}

export async function listTransactions(query) {
  const limit = query.limit ?? 50;
  const where = buildTransactionWhere(query);

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: {
      id: "desc"
    },
    take: limit + 1,
    ...(query.cursor
      ? {
          cursor: {
            id: query.cursor
          },
          skip: 1
        }
      : {})
  });

  const hasNextPage = transactions.length > limit;
  const data = hasNextPage ? transactions.slice(0, limit) : transactions;

  return {
    data,
    pagination: {
      limit,
      nextCursor: hasNextPage ? data[data.length - 1].id : null
    }
  };
}

function buildTransactionWhere(query) {
  const where = {};

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (!query.year) {
    return where;
  }

  const periodFilters = [];

  if (!query.type || query.type === "EXPENSE") {
    periodFilters.push({
      type: "EXPENSE",
      year: query.year,
      ...(query.month ? { month: query.month } : {})
    });
  }

  if (!query.type || query.type === "TRANSFER") {
    periodFilters.push({
      type: "TRANSFER",
      OR: [
        {
          fromYear: query.year,
          ...(query.month ? { fromMonth: query.month } : {})
        },
        {
          toYear: query.year,
          ...(query.month ? { toMonth: query.month } : {})
        }
      ]
    });
  }

  if (periodFilters.length === 1) {
    Object.assign(where, periodFilters[0]);
  } else {
    where.OR = periodFilters;
  }

  return where;
}
