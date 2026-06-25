"use client";

import { useRouter } from "next/navigation";

/** Selector de mes reutilizable (navega con ?m=YYYY-MM sobre `basePath`). */
export function MonthPicker({
  months,
  value,
  basePath = "/portal/finanzas",
}: {
  months: { value: string; label: string }[];
  value: string;
  basePath?: string;
}) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => router.push(`${basePath}?m=${e.target.value}`)}
      className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm font-medium outline-none focus:border-brand"
      aria-label="Mes"
    >
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
