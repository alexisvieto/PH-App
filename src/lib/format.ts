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
    // Símbolo corto ($75.00) en vez del código ISO ("USD 75.00", que es feo y
    // tan ancho que desbordaba las tarjetas del estado de cuenta en móvil).
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  });
}

/** Valida una fecha de calendario real en formato YYYY-MM-DD (rechaza 2026-13-45). */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime()) && value === isoDay(d);
}

/** Edad en años cumplidos a partir de la fecha de nacimiento (se calcula en vivo). */
export function ageFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const b = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age < 0 ? null : age;
}

/** Fecha local (no UTC) como YYYY-MM-DD. */
export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Porcentaje con un decimal. */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("es-PA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}
