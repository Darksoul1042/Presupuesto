import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `PRAGMA foreign_keys = ON`,
  `CREATE TABLE IF NOT EXISTS "departments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "monthly_budgets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "monthly_budgets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "fromYear" INTEGER,
    "fromMonth" INTEGER,
    "toYear" INTEGER,
    "toMonth" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "departments_name_key" ON "departments"("name")`,
  `CREATE INDEX IF NOT EXISTS "monthly_budgets_departmentId_year_month_idx" ON "monthly_budgets"("departmentId", "year", "month")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "monthly_budgets_departmentId_year_month_key" ON "monthly_budgets"("departmentId", "year", "month")`,
  `CREATE INDEX IF NOT EXISTS "transactions_departmentId_year_month_idx" ON "transactions"("departmentId", "year", "month")`,
  `CREATE INDEX IF NOT EXISTS "transactions_departmentId_type_year_month_idx" ON "transactions"("departmentId", "type", "year", "month")`,
  `CREATE INDEX IF NOT EXISTS "transactions_departmentId_type_fromYear_fromMonth_idx" ON "transactions"("departmentId", "type", "fromYear", "fromMonth")`,
  `CREATE INDEX IF NOT EXISTS "transactions_departmentId_type_toYear_toMonth_idx" ON "transactions"("departmentId", "type", "toYear", "toMonth")`,
  `CREATE INDEX IF NOT EXISTS "transactions_departmentId_createdAt_idx" ON "transactions"("departmentId", "createdAt")`
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("SQLite demo schema ready.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
