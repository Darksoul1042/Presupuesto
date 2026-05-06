import { Router } from "express";
import {
  createExpenseController,
  createTransferController,
  listTransactionsController
} from "../controllers/transactionController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createExpenseSchema,
  createTransferSchema,
  transactionQuerySchema
} from "../validators/schemas.js";

const router = Router();

router.get("/", validateQuery(transactionQuerySchema), asyncHandler(listTransactionsController));
router.post("/expense", validateBody(createExpenseSchema), asyncHandler(createExpenseController));
router.post("/transfer", validateBody(createTransferSchema), asyncHandler(createTransferController));

export default router;
