import { getMonthlySummary } from "../services/summaryService.js";

export async function getMonthlySummaryController(req, res) {
  const summary = await getMonthlySummary(req.validated.query);

  res.json({
    data: summary
  });
}
