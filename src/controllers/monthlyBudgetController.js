import { listMonthlyBudgets, upsertMonthlyBudget } from "../services/monthlyBudgetService.js";
import { serializeMonthlyBudget } from "../utils/serializers.js";

export async function upsertMonthlyBudgetController(req, res) {
  const monthlyBudget = await upsertMonthlyBudget(req.validated.body);

  res.status(201).json({
    data: serializeMonthlyBudget(monthlyBudget)
  });
}

export async function listMonthlyBudgetsController(req, res) {
  const monthlyBudgets = await listMonthlyBudgets(req.validated.query);

  res.json({
    data: monthlyBudgets.map(serializeMonthlyBudget)
  });
}
