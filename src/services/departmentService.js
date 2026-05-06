import prisma from "../lib/prisma.js";
import { createHttpError } from "../utils/httpError.js";

export async function createDepartment(data) {
  return prisma.department.create({
    data: {
      name: data.name
    }
  });
}

export async function listDepartments() {
  return prisma.department.findMany({
    orderBy: {
      name: "asc"
    }
  });
}

export async function ensureDepartmentExists(departmentId, db = prisma) {
  const department = await db.department.findUnique({
    where: {
      id: departmentId
    },
    select: {
      id: true
    }
  });

  if (!department) {
    throw createHttpError(404, "Department not found");
  }

  return department;
}
