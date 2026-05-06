import { Router } from "express";
import { getHealthController } from "../controllers/healthController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import departmentsRoutes from "./departments.routes.js";
import monthlyBudgetsRoutes from "./monthlyBudgets.routes.js";
import summaryRoutes from "./summary.routes.js";
import transactionsRoutes from "./transactions.routes.js";

const router = Router();

router.get("/health", asyncHandler(getHealthController));
router.use("/departments", departmentsRoutes);
router.use("/monthly-budgets", monthlyBudgetsRoutes);
router.use("/summary", summaryRoutes);
router.use("/transactions", transactionsRoutes);

export default router;
