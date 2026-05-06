import { Prisma } from "@prisma/client";

export function toDecimal(value = 0) {
  if (value instanceof Prisma.Decimal) return value;
  return new Prisma.Decimal(value);
}

export function decimalToString(value = 0) {
  return toDecimal(value).toFixed(2);
}

export function zeroDecimal() {
  return new Prisma.Decimal(0);
}
