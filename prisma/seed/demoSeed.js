import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const YEAR = 2026;

const departments = [
  {
    name: "Finanzas",
    monthlyBudgetBase: 5200,
    expenses: [
      [1, "Software contable", 420.25],
      [1, "Servicios cloud", 310.5],
      [2, "Auditoria externa", 890],
      [3, "Capacitacion financiera", 275.75],
      [4, "Licencias BI", 640]
    ],
    transfers: [
      [1, 2, "Refuerzo para cierre mensual", 500],
      [3, 5, "Reserva para analitica", 350]
    ]
  },
  {
    name: "Operaciones",
    monthlyBudgetBase: 7600,
    expenses: [
      [1, "Mantenimiento equipos", 980],
      [2, "Logistica interna", 1250.4],
      [3, "Inventario critico", 2100],
      [4, "Servicios externos", 870]
    ],
    transfers: [
      [2, 3, "Apoyo a compras operativas", 800],
      [4, 6, "Plan preventivo", 450]
    ]
  },
  {
    name: "Marketing",
    monthlyBudgetBase: 4300,
    expenses: [
      [1, "Campana digital", 690],
      [2, "Produccion creativa", 1150],
      [3, "Eventos comerciales", 920.9],
      [5, "Herramientas CRM", 330]
    ],
    transfers: [
      [1, 3, "Lanzamiento Q1", 600],
      [5, 7, "Campana segundo semestre", 500]
    ]
  }
];

async function main() {
  for (const departmentSeed of departments) {
    const department = await prisma.department.upsert({
      where: { name: departmentSeed.name },
      update: {},
      create: { name: departmentSeed.name }
    });

    for (let month = 1; month <= 12; month += 1) {
      const amount = new Prisma.Decimal(departmentSeed.monthlyBudgetBase + month * 115);

      await prisma.monthlyBudget.upsert({
        where: {
          departmentId_year_month: {
            departmentId: department.id,
            year: YEAR,
            month
          }
        },
        update: { amount },
        create: {
          departmentId: department.id,
          year: YEAR,
          month,
          amount
        }
      });
    }

    for (const [month, description, amount] of departmentSeed.expenses) {
      await ensureTransaction({
        departmentId: department.id,
        type: "EXPENSE",
        year: YEAR,
        month,
        amount,
        description
      });
    }

    for (const [fromMonth, toMonth, description, amount] of departmentSeed.transfers) {
      await ensureTransaction({
        departmentId: department.id,
        type: "TRANSFER",
        fromYear: YEAR,
        fromMonth,
        toYear: YEAR,
        toMonth,
        amount,
        description
      });
    }
  }
}

async function ensureTransaction(data) {
  const existing = await prisma.transaction.findFirst({
    where: {
      departmentId: data.departmentId,
      type: data.type,
      description: data.description
    }
  });

  if (existing) return existing;

  return prisma.transaction.create({
    data: {
      ...data,
      amount: new Prisma.Decimal(data.amount)
    }
  });
}

main()
  .then(async () => {
    console.log("Demo data ready.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
