/** Formato de fecha corto (es-PA). Acepta ISO string o null. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Monto en moneda (por defecto USD, como en Panamá). */
export function formatMoney(
  value: number | null | undefined,
  currency = "USD",
): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("es-PA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

/** Porcentaje con un decimal. */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("es-PA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}
