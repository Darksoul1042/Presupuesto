const months = Array.from({ length: 12 }, (_, index) => index + 1);
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const state = {
  departments: [],
  departmentId: "",
  year: 2026,
  summary: [],
  transactions: [],
  nextCursor: null
};

const $ = (id) => document.getElementById(id);

function money(value) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || "No se pudo completar la operacion");
  }

  return payload;
}

function showMessage(text, isError = false) {
  const element = $("message");
  element.textContent = text;
  element.classList.toggle("error", isError);
  element.hidden = !text;
}

function fillMonthSelects() {
  for (const id of ["budgetMonth", "expenseMonth", "transferFromMonth", "transferToMonth"]) {
    const select = $(id);
    select.innerHTML = months.map((month) => `<option value="${month}">${monthNames[month - 1]}</option>`).join("");
  }

  $("transferToMonth").value = "2";
}

async function loadDepartments() {
  const response = await request("/departments");
  state.departments = response.data;
  state.departmentId = state.departmentId || String(response.data[0]?.id || "");

  $("departmentSelect").innerHTML = state.departments
    .map((department) => `<option value="${department.id}">${department.name}</option>`)
    .join("");
  $("departmentSelect").value = state.departmentId;
}

async function loadWorkspace(resetTransactions = true) {
  if (!state.departmentId) {
    return;
  }

  const departmentId = Number(state.departmentId);
  const [summaryResponse, transactionResponse] = await Promise.all([
    request(`/summary?departmentId=${departmentId}&year=${state.year}&months=${months.join(",")}`),
    request(`/transactions?departmentId=${departmentId}&year=${state.year}&limit=8`)
  ]);

  state.summary = summaryResponse.data.months;
  if (resetTransactions) {
    state.transactions = transactionResponse.data;
  }
  state.nextCursor = transactionResponse.pagination.nextCursor;

  render();
}

async function loadMoreTransactions() {
  if (!state.nextCursor) return;

  const response = await request(
    `/transactions?departmentId=${state.departmentId}&year=${state.year}&limit=8&cursor=${state.nextCursor}`
  );
  state.transactions = [...state.transactions, ...response.data];
  state.nextCursor = response.pagination.nextCursor;
  renderTransactions();
}

function render() {
  renderSummary();
  renderTransactions();
}

function renderSummary() {
  const department = state.departments.find((item) => item.id === Number(state.departmentId));
  $("summaryTitle").textContent = department?.name || "Resumen mensual";
  $("summarySubtitle").textContent = `Resumen mensual ${state.year}`;

  const totals = state.summary.reduce(
    (acc, item) => ({
      initial: acc.initial + Number(item.initial),
      expenses: acc.expenses + Number(item.expenses),
      transferredOut: acc.transferredOut + Number(item.transferredOut),
      transferredIn: acc.transferredIn + Number(item.transferredIn),
      available: acc.available + Number(item.available)
    }),
    { initial: 0, expenses: 0, transferredOut: 0, transferredIn: 0, available: 0 }
  );

  $("initialTotal").textContent = money(totals.initial);
  $("availableTotal").textContent = money(totals.available);
  $("expenseTotal").textContent = money(totals.expenses);
  $("transferNet").textContent = money(totals.transferredIn - totals.transferredOut);

  $("summaryRows").innerHTML =
    state.summary
      .map(
        (item) => `
        <tr>
          <td>${monthNames[item.month - 1]}</td>
          <td>${money(item.initial)}</td>
          <td>${money(item.expenses)}</td>
          <td>${money(item.transferredOut)}</td>
          <td>${money(item.transferredIn)}</td>
          <td class="strong">${money(item.available)}</td>
        </tr>
      `
      )
      .join("") || `<tr><td colspan="6">No hay resumen para este periodo.</td></tr>`;

  const max = Math.max(...state.summary.map((item) => Number(item.initial)), 1);
  $("chart").innerHTML = state.summary
    .map((item) => {
      const available = Math.max(Number(item.available), 0);
      const expenses = Number(item.expenses);
      const availableHeight = Math.max((available / max) * 100, 3);
      const expenseHeight = Math.max((expenses / max) * 100, expenses > 0 ? 3 : 0);

      return `
        <div class="chart-month">
          <div class="bars">
            <span class="bar available" style="height:${availableHeight}%"></span>
            <span class="bar expense" style="height:${expenseHeight}%"></span>
          </div>
          <small>${monthNames[item.month - 1]}</small>
        </div>
      `;
    })
    .join("");
}

function renderTransactions() {
  $("transactionCount").textContent = `${state.transactions.length} registros cargados`;
  $("loadMoreButton").hidden = !state.nextCursor;

  $("transactionRows").innerHTML =
    state.transactions
      .map((item) => {
        const isExpense = item.type === "EXPENSE";
        const period = isExpense
          ? `${monthNames[item.month - 1]} ${item.year}`
          : `${monthNames[item.fromMonth - 1]} ${item.fromYear} -> ${monthNames[item.toMonth - 1]} ${item.toYear}`;

        return `
          <tr>
            <td><span class="tag ${isExpense ? "expense-tag" : "transfer-tag"}">${isExpense ? "Gasto" : "Transferencia"}</span></td>
            <td>${period}</td>
            <td>${item.description || "Sin descripcion"}</td>
            <td class="strong">${money(item.amount)}</td>
          </tr>
        `;
      })
      .join("") || `<tr><td colspan="4">No hay movimientos todavia.</td></tr>`;
}

async function submitForm(action, successMessage) {
  try {
    showMessage("");
    await action();
    showMessage(successMessage);
    await loadWorkspace();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function attachEvents() {
  $("refreshButton").addEventListener("click", () => loadWorkspace().catch((error) => showMessage(error.message, true)));
  $("departmentSelect").addEventListener("change", (event) => {
    state.departmentId = event.target.value;
    loadWorkspace().catch((error) => showMessage(error.message, true));
  });
  $("yearInput").addEventListener("change", (event) => {
    state.year = Number(event.target.value);
    loadWorkspace().catch((error) => showMessage(error.message, true));
  });
  $("loadMoreButton").addEventListener("click", () =>
    loadMoreTransactions().catch((error) => showMessage(error.message, true))
  );

  $("departmentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(async () => {
      const response = await request("/departments", {
        method: "POST",
        body: JSON.stringify({ name: $("departmentName").value.trim() })
      });
      $("departmentName").value = "";
      await loadDepartments();
      state.departmentId = String(response.data.id);
      $("departmentSelect").value = state.departmentId;
    }, "Departamento creado");
  });

  $("budgetForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(async () => {
      await request("/monthly-budgets", {
        method: "POST",
        body: JSON.stringify({
          departmentId: Number(state.departmentId),
          year: state.year,
          month: Number($("budgetMonth").value),
          amount: $("budgetAmount").value
        })
      });
      $("budgetAmount").value = "";
    }, "Presupuesto actualizado");
  });

  $("expenseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(async () => {
      await request("/transactions/expense", {
        method: "POST",
        body: JSON.stringify({
          departmentId: Number(state.departmentId),
          year: state.year,
          month: Number($("expenseMonth").value),
          amount: $("expenseAmount").value,
          description: $("expenseDescription").value.trim()
        })
      });
      $("expenseAmount").value = "";
      $("expenseDescription").value = "";
    }, "Gasto registrado");
  });

  $("transferForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(async () => {
      await request("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({
          departmentId: Number(state.departmentId),
          fromYear: state.year,
          fromMonth: Number($("transferFromMonth").value),
          toYear: state.year,
          toMonth: Number($("transferToMonth").value),
          amount: $("transferAmount").value,
          description: $("transferDescription").value.trim()
        })
      });
      $("transferAmount").value = "";
      $("transferDescription").value = "";
    }, "Transferencia registrada");
  });
}

async function boot() {
  try {
    fillMonthSelects();
    attachEvents();
    await loadDepartments();
    await loadWorkspace();
  } catch (error) {
    showMessage(error.message, true);
    $("departmentSelect").innerHTML = `<option value="">Sin datos</option>`;
    $("summaryRows").innerHTML = `<tr><td colspan="6">No se pudo cargar la API.</td></tr>`;
    $("transactionRows").innerHTML = `<tr><td colspan="4">No se pudo cargar la API.</td></tr>`;
  }
}

boot();
