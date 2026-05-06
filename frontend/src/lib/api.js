const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message ?? "No se pudo completar la operacion";
    throw new Error(message);
  }

  return payload;
}

export const api = {
  apiUrl: API_URL,
  health: () => request("/health"),
  departments: () => request("/departments"),
  createDepartment: (body) =>
    request("/departments", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  monthlyBudgets: ({ departmentId, year }) =>
    request(`/monthly-budgets?departmentId=${departmentId}&year=${year}`),
  saveMonthlyBudget: (body) =>
    request("/monthly-budgets", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  summary: ({ departmentId, year, months }) =>
    request(`/summary?departmentId=${departmentId}&year=${year}&months=${months.join(",")}`),
  transactions: ({ departmentId, year, cursor, limit = 8 }) => {
    const params = new URLSearchParams({
      departmentId,
      year,
      limit
    });

    if (cursor) params.set("cursor", cursor);

    return request(`/transactions?${params.toString()}`);
  },
  createExpense: (body) =>
    request("/transactions/expense", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  createTransfer: (body) =>
    request("/transactions/transfer", {
      method: "POST",
      body: JSON.stringify(body)
    })
};
