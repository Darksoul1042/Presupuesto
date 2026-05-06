import { Router } from "express";
import {
  createDepartmentController,
  listDepartmentsController
} from "../controllers/departmentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { createDepartmentSchema } from "../validators/schemas.js";

const router = Router();

router.post("/", validateBody(createDepartmentSchema), asyncHandler(createDepartmentController));
router.get("/", asyncHandler(listDepartmentsController));

export default router;
