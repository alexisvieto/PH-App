"use client";

import { useRouter } from "next/navigation";

/** Selector de mes para la vista de finanzas del portal (navega con ?m=YYYY-MM). */
export function MonthPicker({ months, value }: { months: { value: string; label: string }[]; value: string }) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => router.push(`/portal/finanzas?m=${e.target.value}`)}
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
