import { z } from "zod";
import { toDecimal } from "../utils/money.js";

const moneyPattern = /^\d+(\.\d{1,2})?$/;

export const idSchema = z.coerce.number().int().positive();
export const yearSchema = z.coerce.number().int().min(1900).max(3000);
export const monthSchema = z.coerce.number().int().min(1).max(12);

export const moneySchema = z
  .union([z.string().trim().min(1), z.number().finite()])
  .transform((value) => String(value))
  .refine((value) => moneyPattern.test(value), {
    message: "amount must be a positive decimal with up to two decimals"
  })
  .transform((value) => toDecimal(value))
  .refine((value) => value.gt(0), {
    message: "amount must be greater than zero"
  });

const descriptionSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

export const upsertMonthlyBudgetSchema = z.object({
  departmentId: idSchema,
  year: yearSchema,
  month: monthSchema,
  amount: moneySchema
});

export const getMonthlyBudgetsQuerySchema = z.object({
  departmentId: idSchema,
  year: yearSchema
});

export const createExpenseSchema = z.object({
  departmentId: idSchema,
  year: yearSchema,
  month: monthSchema,
  amount: moneySchema,
  description: descriptionSchema
});

export const createTransferSchema = z
  .object({
    departmentId: idSchema,
    fromYear: yearSchema,
    fromMonth: monthSchema,
    toYear: yearSchema,
    toMonth: monthSchema,
    amount: moneySchema,
    description: descriptionSchema
  })
  .refine((value) => value.fromYear !== value.toYear || value.fromMonth !== value.toMonth, {
    message: "transfer origin and destination periods must be different",
    path: ["toMonth"]
  });

export const transactionQuerySchema = z
  .object({
    departmentId: idSchema.optional(),
    year: yearSchema.optional(),
    month: monthSchema.optional(),
    type: z.enum(["EXPENSE", "TRANSFER"]).optional(),
    cursor: idSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
  .refine((value) => !value.month || value.year, {
    message: "year is required when month is provided",
    path: ["year"]
  });

function parseMonths(value, ctx) {
  const parts = String(value)
    .split(",")
    .map((part) => part.trim());

  const months = parts.map((part) => Number(part));

  const hasInvalidMonth =
    parts.length === 0 ||
    parts.some((part) => part === "") ||
    months.some((month) => !Number.isInteger(month) || month < 1 || month > 12);

  if (hasInvalidMonth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "months must be a comma-separated list of values from 1 to 12"
    });
    return z.NEVER;
  }

  return [...new Set(months)].sort((a, b) => a - b);
}

export const summaryQuerySchema = z.object({
  departmentId: idSchema,
  year: yearSchema,
  months: z.string().min(1).transform(parseMonths)
});
