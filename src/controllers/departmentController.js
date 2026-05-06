import { createDepartment, listDepartments } from "../services/departmentService.js";
import { serializeDepartment } from "../utils/serializers.js";

export async function createDepartmentController(req, res) {
  const department = await createDepartment(req.validated.body);

  res.status(201).json({
    data: serializeDepartment(department)
  });
}

export async function listDepartmentsController(req, res) {
  const departments = await listDepartments();

  res.json({
    data: departments.map(serializeDepartment)
  });
}
