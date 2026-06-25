"use client";

import { useRouter } from "next/navigation";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const sel =
  "min-h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand";

/** Selectores de mes y año del dashboard (navegan con ?y=YYYY&m=MM|all). */
export function DashboardFilters({
  year,
  month,
  years,
}: {
  year: string;
  month: string;
  years: string[];
}) {
  const router = useRouter();
  const go = (y: string, m: string) => router.push(`/app/reservas/dashboard?y=${y}&m=${m}`);

  return (
    <div className="flex flex-wrap gap-2">
      <select value={month} onChange={(e) => go(year, e.target.value)} className={sel} aria-label="Mes">
        <option value="all">Todo el año</option>
        {MESES.map((label, i) => (
          <option key={i} value={String(i + 1).padStart(2, "0")}>
            {label}
          </option>
        ))}
      </select>
      <select value={year} onChange={(e) => go(e.target.value, month)} className={sel} aria-label="Año">
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
