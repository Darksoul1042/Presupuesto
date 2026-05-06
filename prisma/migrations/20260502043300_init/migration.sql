-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'TRANSFER');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_budgets" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "fromYear" INTEGER,
    "fromMonth" INTEGER,
    "toYear" INTEGER,
    "toMonth" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "monthly_budgets_departmentId_year_month_idx" ON "monthly_budgets"("departmentId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_budgets_departmentId_year_month_key" ON "monthly_budgets"("departmentId", "year", "month");

-- CreateIndex
CREATE INDEX "transactions_departmentId_year_month_idx" ON "transactions"("departmentId", "year", "month");

-- CreateIndex
CREATE INDEX "transactions_departmentId_type_year_month_idx" ON "transactions"("departmentId", "type", "year", "month");

-- CreateIndex
CREATE INDEX "transactions_departmentId_type_fromYear_fromMonth_idx" ON "transactions"("departmentId", "type", "fromYear", "fromMonth");

-- CreateIndex
CREATE INDEX "transactions_departmentId_type_toYear_toMonth_idx" ON "transactions"("departmentId", "type", "toYear", "toMonth");

-- CreateIndex
CREATE INDEX "transactions_departmentId_createdAt_idx" ON "transactions"("departmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
