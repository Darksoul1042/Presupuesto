export const monthNames = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
];

export function money(value) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD"
  }).format(number);
}

export function periodLabel(transaction) {
  if (transaction.type === "EXPENSE") {
    return `${monthNames[transaction.month - 1]} ${transaction.year}`;
  }

  return `${monthNames[transaction.fromMonth - 1]} ${transaction.fromYear} -> ${
    monthNames[transaction.toMonth - 1]
  } ${transaction.toYear}`;
}
