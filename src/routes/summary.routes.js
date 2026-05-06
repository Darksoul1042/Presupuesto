import { Router } from "express";
import { getMonthlySummaryController } from "../controllers/summaryController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateQuery } from "../middleware/validate.js";
import { summaryQuerySchema } from "../validators/schemas.js";

const router = Router();

router.get("/", validateQuery(summaryQuerySchema), asyncHandler(getMonthlySummaryController));

export default router;
