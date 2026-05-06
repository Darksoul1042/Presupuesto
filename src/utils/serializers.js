import { decimalToString } from "./money.js";

function serializeDate(value) {
  if (!value) return value;
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeDepartment(department) {
  return {
    id: department.id,
    name: department.name,
    createdAt: serializeDate(department.createdAt),
    updatedAt: serializeDate(department.updatedAt)
  };
}

export function serializeMonthlyBudget(monthlyBudget) {
  return {
    id: monthlyBudget.id,
    departmentId: monthlyBudget.departmentId,
    year: monthlyBudget.year,
    month: monthlyBudget.month,
    amount: decimalToString(monthlyBudget.amount),
    createdAt: serializeDate(monthlyBudget.createdAt),
    updatedAt: serializeDate(monthlyBudget.updatedAt)
  };
}

export function serializeTransaction(transaction) {
  return {
    id: transaction.id,
    departmentId: transaction.departmentId,
    type: transaction.type,
    amount: decimalToString(transaction.amount),
    year: transaction.year,
    month: transaction.month,
    fromYear: transaction.fromYear,
    fromMonth: transaction.fromMonth,
    toYear: transaction.toYear,
    toMonth: transaction.toMonth,
    description: transaction.description,
    createdAt: serializeDate(transaction.createdAt),
    updatedAt: serializeDate(transaction.updatedAt)
  };
}
