/** Formato de fecha corto (es-PA). Acepta ISO string o null.
 *  Para fechas de solo día ("YYYY-MM-DD") se interpreta como fecha de
 *  calendario local (evita el corrimiento de un día por zona horaria). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const d = new Date(iso);
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
