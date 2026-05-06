import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  CircleDollarSign,
  Loader2,
  Plus,
  RefreshCcw,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "./lib/api.js";
import { money, monthNames, periodLabel } from "./lib/format.js";

const months = Array.from({ length: 12 }, (_, index) => index + 1);
const currentYear = 2026;

const emptyExpense = {
  month: 1,
  amount: "",
  description: ""
};

const emptyTransfer = {
  fromMonth: 1,
  toMonth: 2,
  amount: "",
  description: ""
};

export function App() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [budgetForm, setBudgetForm] = useState({ month: 1, amount: "" });
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const selectedDepartment = departments.find((department) => department.id === Number(selectedDepartmentId));

  const totals = useMemo(() => {
    const rows = summary?.months ?? [];
    return rows.reduce(
      (acc, row) => ({
        initial: acc.initial + Number(row.initial),
        expenses: acc.expenses + Number(row.expenses),
        transferredOut: acc.transferredOut + Number(row.transferredOut),
        transferredIn: acc.transferredIn + Number(row.transferredIn),
        available: acc.available + Number(row.available)
      }),
      {
        initial: 0,
        expenses: 0,
        transferredOut: 0,
        transferredIn: 0,
        available: 0
      }
    );
  }, [summary]);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartmentId) {
      reloadWorkspace();
    }
  }, [selectedDepartmentId, year]);

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");
      const response = await api.departments();
      setDepartments(response.data);
      setSelectedDepartmentId((current) => current || response.data[0]?.id?.toString() || "");
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setLoading(false);
    }
  }

  async function reloadWorkspace() {
    if (!selectedDepartmentId) return;

    try {
      setRefreshing(true);
      setError("");
      const departmentId = Number(selectedDepartmentId);
      const [summaryResponse, budgetsResponse, transactionResponse] = await Promise.all([
        api.summary({ departmentId, year, months }),
        api.monthlyBudgets({ departmentId, year }),
        api.transactions({ departmentId, year })
      ]);

      setSummary(summaryResponse.data);
      setBudgets(budgetsResponse.data);
      setTransactions(transactionResponse.data);
      setNextCursor(transactionResponse.pagination.nextCursor);
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMoreTransactions() {
    if (!nextCursor || !selectedDepartmentId) return;

    try {
      setRefreshing(true);
      const response = await api.transactions({
        departmentId: Number(selectedDepartmentId),
        year,
        cursor: nextCursor
      });

      setTransactions((current) => [...current, ...response.data]);
      setNextCursor(response.pagination.nextCursor);
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCreateDepartment(event) {
    event.preventDefault();
    if (!newDepartment.trim()) return;

    await submit(async () => {
      const response = await api.createDepartment({ name: newDepartment.trim() });
      setMessage("Departamento creado");
      setNewDepartment("");
      await loadDepartments();
      setSelectedDepartmentId(response.data.id.toString());
    });
  }

  async function handleBudget(event) {
    event.preventDefault();
    if (!selectedDepartmentId) return;

    await submit(async () => {
      await api.saveMonthlyBudget({
        departmentId: Number(selectedDepartmentId),
        year,
        month: Number(budgetForm.month),
        amount: budgetForm.amount
      });
      setMessage("Presupuesto actualizado");
      setBudgetForm({ month: budgetForm.month, amount: "" });
      await reloadWorkspace();
    });
  }

  async function handleExpense(event) {
    event.preventDefault();
    if (!selectedDepartmentId) return;

    await submit(async () => {
      await api.createExpense({
        departmentId: Number(selectedDepartmentId),
        year,
        month: Number(expenseForm.month),
        amount: expenseForm.amount,
        description: expenseForm.description
      });
      setMessage("Gasto registrado");
      setExpenseForm(emptyExpense);
      await reloadWorkspace();
    });
  }

  async function handleTransfer(event) {
    event.preventDefault();
    if (!selectedDepartmentId) return;

    await submit(async () => {
      await api.createTransfer({
        departmentId: Number(selectedDepartmentId),
        fromYear: year,
        fromMonth: Number(transferForm.fromMonth),
        toYear: year,
        toMonth: Number(transferForm.toMonth),
        amount: transferForm.amount,
        description: transferForm.description
      });
      setMessage("Transferencia registrada");
      setTransferForm(emptyTransfer);
      await reloadWorkspace();
    });
  }

  async function submit(action) {
    try {
      setError("");
      setMessage("");
      setRefreshing(true);
      await action();
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div className="brand-mark">
          <BarChart3 size={30} />
        </div>
        <div>
          <h1>Alloca</h1>
          <p>Presupuestos. Control. Resultados.</p>
        </div>
        <button className="icon-button" type="button" onClick={reloadWorkspace} disabled={refreshing}>
          {refreshing ? <Loader2 className="spin" size={18} /> : <RefreshCcw size={18} />}
        </button>
      </section>

      <section className="workspace-controls">
        <label>
          Departamento
          <select value={selectedDepartmentId} onChange={(event) => setSelectedDepartmentId(event.target.value)}>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Año
          <input
            type="number"
            value={year}
            min="2020"
            max="2035"
            onChange={(event) => setYear(Number(event.target.value))}
          />
        </label>
        <form className="inline-form" onSubmit={handleCreateDepartment}>
          <input
            value={newDepartment}
            onChange={(event) => setNewDepartment(event.target.value)}
            placeholder="Nuevo departamento"
            required
          />
          <button type="submit">
            <Plus size={16} />
            Crear
          </button>
        </form>
      </section>

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={28} />
          Cargando presupuesto
        </div>
      ) : (
        <>
          <section className="metric-grid">
            <Metric icon={<WalletCards size={20} />} label="Presupuesto inicial" value={money(totals.initial)} />
            <Metric icon={<CircleDollarSign size={20} />} label="Disponible" value={money(totals.available)} strong />
            <Metric icon={<BarChart3 size={20} />} label="Gastos" value={money(totals.expenses)} />
            <Metric icon={<ArrowRightLeft size={20} />} label="Transferencias netas" value={money(totals.transferredIn - totals.transferredOut)} />
          </section>

          <section className="dashboard-grid">
            <div className="summary-panel">
              <div className="section-heading">
                <div>
                  <h2>{selectedDepartment?.name ?? "Sin departamento"}</h2>
                  <p>Resumen mensual {year}</p>
                </div>
              </div>
              <MonthlyChart rows={summary?.months ?? []} />
              <MonthlyTable rows={summary?.months ?? []} />
            </div>

            <div className="actions-panel">
              <BudgetForm form={budgetForm} setForm={setBudgetForm} onSubmit={handleBudget} />
              <ExpenseForm form={expenseForm} setForm={setExpenseForm} onSubmit={handleExpense} />
              <TransferForm form={transferForm} setForm={setTransferForm} onSubmit={handleTransfer} />
            </div>
          </section>

          <section className="transactions-section">
            <div className="section-heading">
              <div>
                <h2>Movimientos</h2>
                <p>{transactions.length} registros cargados</p>
              </div>
            </div>
            <TransactionTable rows={transactions} />
            {nextCursor && (
              <button className="secondary-button" type="button" onClick={loadMoreTransactions} disabled={refreshing}>
                Cargar más
              </button>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ icon, label, value, strong }) {
  return (
    <article className={strong ? "metric metric-strong" : "metric"}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function MonthlyChart({ rows }) {
  const max = Math.max(...rows.map((row) => Number(row.initial)), 1);

  return (
    <div className="chart" aria-label="Resumen grafico mensual">
      {rows.map((row) => {
        const available = Math.max(Number(row.available), 0);
        const expenses = Number(row.expenses);
        const availableHeight = `${Math.max((available / max) * 100, 3)}%`;
        const expenseHeight = `${Math.max((expenses / max) * 100, expenses > 0 ? 3 : 0)}%`;

        return (
          <div className="chart-month" key={row.month}>
            <div className="bars">
              <span className="bar available" style={{ height: availableHeight }} />
              <span className="bar expense" style={{ height: expenseHeight }} />
            </div>
            <small>{monthNames[row.month - 1]}</small>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyTable({ rows }) {
  if (!rows.length) return <div className="empty-state">No hay resumen para este periodo.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Inicial</th>
            <th>Gastos</th>
            <th>Enviado</th>
            <th>Recibido</th>
            <th>Disponible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td>{monthNames[row.month - 1]}</td>
              <td>{money(row.initial)}</td>
              <td>{money(row.expenses)}</td>
              <td>{money(row.transferredOut)}</td>
              <td>{money(row.transferredIn)}</td>
              <td className="strong-cell">{money(row.available)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetForm({ form, setForm, onSubmit }) {
  return (
    <form className="action-card" onSubmit={onSubmit}>
      <h3>Presupuesto mensual</h3>
      <MonthSelect value={form.month} onChange={(month) => setForm({ ...form, month })} />
      <MoneyInput value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
      <button type="submit">Guardar presupuesto</button>
    </form>
  );
}

function ExpenseForm({ form, setForm, onSubmit }) {
  return (
    <form className="action-card" onSubmit={onSubmit}>
      <h3>Registrar gasto</h3>
      <MonthSelect value={form.month} onChange={(month) => setForm({ ...form, month })} />
      <MoneyInput value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
      <input
        value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
        placeholder="Descripcion"
        required
      />
      <button type="submit">Registrar gasto</button>
    </form>
  );
}

function TransferForm({ form, setForm, onSubmit }) {
  return (
    <form className="action-card" onSubmit={onSubmit}>
      <h3>Transferir entre meses</h3>
      <div className="split-inputs">
        <MonthSelect label="Desde" value={form.fromMonth} onChange={(fromMonth) => setForm({ ...form, fromMonth })} />
        <MonthSelect label="Hacia" value={form.toMonth} onChange={(toMonth) => setForm({ ...form, toMonth })} />
      </div>
      <MoneyInput value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
      <input
        value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
        placeholder="Descripcion"
        required
      />
      <button type="submit">Transferir</button>
    </form>
  );
}

function MonthSelect({ label = "Mes", value, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {months.map((month) => (
          <option key={month} value={month}>
            {monthNames[month - 1]}
          </option>
        ))}
      </select>
    </label>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <label>
      Monto
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0.00"
        required
      />
    </label>
  );
}

function TransactionTable({ rows }) {
  if (!rows.length) return <div className="empty-state">No hay movimientos todavia.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Periodo</th>
            <th>Descripcion</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className={row.type === "EXPENSE" ? "tag expense-tag" : "tag transfer-tag"}>
                  {row.type === "EXPENSE" ? "Gasto" : "Transferencia"}
                </span>
              </td>
              <td>{periodLabel(row)}</td>
              <td>{row.description ?? "Sin descripcion"}</td>
              <td className="strong-cell">{money(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
