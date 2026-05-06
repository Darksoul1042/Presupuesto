import { createExpense, createTransfer, listTransactions } from "../services/transactionService.js";
import { serializeTransaction } from "../utils/serializers.js";

export async function createExpenseController(req, res) {
  const transaction = await createExpense(req.validated.body);

  res.status(201).json({
    data: serializeTransaction(transaction)
  });
}

export async function createTransferController(req, res) {
  const transaction = await createTransfer(req.validated.body);

  res.status(201).json({
    data: serializeTransaction(transaction)
  });
}

export async function listTransactionsController(req, res) {
  const result = await listTransactions(req.validated.query);

  res.json({
    data: result.data.map(serializeTransaction),
    pagination: result.pagination
  });
}
