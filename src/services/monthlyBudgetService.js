import prisma from "../lib/prisma.js";
import { ensureDepartmentExists } from "./departmentService.js";
import { invalidateSummaryCache } from "./cacheService.js";

export async function upsertMonthlyBudget(data) {
  await ensureDepartmentExists(data.departmentId);

  const monthlyBudget = await prisma.monthlyBudget.upsert({
    where: {
      departmentId_year_month: {
        departmentId: data.departmentId,
        year: data.year,
        month: data.month
      }
    },
    update: {
      amount: data.amount
    },
    create: {
      departmentId: data.departmentId,
      year: data.year,
      month: data.month,
      amount: data.amount
    }
  });

  await invalidateSummaryCache(data.departmentId, [data.year]);

  return monthlyBudget;
}

export async function listMonthlyBudgets({ departmentId, year }) {
  await ensureDepartmentExists(departmentId);

  return prisma.monthlyBudget.findMany({
    where: {
      departmentId,
      year
    },
    orderBy: {
      month: "asc"
    }
  });
}
