import { Router } from "express";
import {
  listMonthlyBudgetsController,
  upsertMonthlyBudgetController
} from "../controllers/monthlyBudgetController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { getMonthlyBudgetsQuerySchema, upsertMonthlyBudgetSchema } from "../validators/schemas.js";

const router = Router();

router.post("/", validateBody(upsertMonthlyBudgetSchema), asyncHandler(upsertMonthlyBudgetController));
router.get("/", validateQuery(getMonthlyBudgetsQuerySchema), asyncHandler(listMonthlyBudgetsController));

export default router;
