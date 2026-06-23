"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import type { Movement } from "@/lib/statement";

// Vista móvil del ledger: tarjetas apiladas agrupadas por mes (colapsadas, se
// abren con "+"). Los años anteriores al más reciente se agrupan en un
// acordeón anual; al abrirlo aparecen sus meses. Así el estado de cuenta se
// mantiene compacto aunque pasen los años.

type MonthGroup = { key: string; label: string; items: Movement[]; closing: number };
type YearGroup = { year: string; months: MonthGroup[]; closing: number };

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return cap(
    new Date(y, m - 1, 1).toLocaleDateString("es-PA", { month: "long", year: "numeric" }),
  );
}

/** Agrupa los movimientos (asc.) en años → meses, ambos en orden descendente. */
function buildGroups(movements: Movement[]): YearGroup[] {
  const byYear = new Map<string, Map<string, Movement[]>>();
  for (const m of movements) {
    const y = m.date.slice(0, 4);
    const ym = m.date.slice(0, 7);
    if (!byYear.has(y)) byYear.set(y, new Map());
    const months = byYear.get(y)!;
    if (!months.has(ym)) months.set(ym, []);
    months.get(ym)!.push(m);
  }

  const years: YearGroup[] = [];
  for (const [year, months] of byYear) {
    const monthGroups: MonthGroup[] = [];
    for (const [ym, items] of months) {
      monthGroups.push({
        key: ym,
        label: monthLabel(ym),
        items: [...items].reverse(), // más reciente primero dentro del mes
        closing: items[items.length - 1].balance,
      });
    }
    monthGroups.sort((a, b) => (a.key < b.key ? 1 : -1)); // meses desc.
    years.push({ year, months: monthGroups, closing: monthGroups[0].closing });
  }
  years.sort((a, b) => (a.year < b.year ? 1 : -1)); // años desc.
  return years;
}

export function StatementMovements({ movements }: { movements: Movement[] }) {
  const groups = buildGroups(movements);
  // Por defecto, abierto el mes más reciente; el resto cerrado.
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set(groups[0]?.months[0] ? [groups[0].months[0].key] : []),
  );
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, key: string, apply: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    apply(next);
  }

  function MonthCard({ g }: { g: MonthGroup }) {
    const open = openMonths.has(g.key);
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <button
          type="button"
          onClick={() => toggle(openMonths, g.key, setOpenMonths)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="min-w-0">
            <p className="font-medium">{g.label}</p>
            <p className="text-xs text-muted">Saldo al cierre: {formatMoney(g.closing)}</p>
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-muted">
            {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
          </span>
        </button>
        {open && (
          <ul className="divide-y divide-line border-t border-line">
            {g.items.map((m, i) => (
              <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.concept}</p>
                  <p className="text-xs text-muted">{formatDate(m.date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-semibold tabular-nums ${m.kind === "pago" ? "text-emerald-700" : ""}`}
                  >
                    {m.kind === "pago"
                      ? `− ${formatMoney(m.credit)}`
                      : `+ ${formatMoney(m.debit)}`}
                  </p>
                  <p className="text-xs text-muted tabular-nums">Saldo {formatMoney(m.balance)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Año más reciente: meses directos */}
      {groups[0]?.months.map((g) => <MonthCard key={g.key} g={g} />)}

      {/* Años anteriores: acordeón anual */}
      {groups.slice(1).map((y) => {
        const open = openYears.has(y.year);
        return (
          <div key={y.year} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <button
              type="button"
              onClick={() => toggle(openYears, y.year, setOpenYears)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-medium">{y.year}</p>
                <p className="text-xs text-muted">Saldo al cierre: {formatMoney(y.closing)}</p>
              </div>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-muted">
                {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
              </span>
            </button>
            {open && (
              <div className="space-y-2 border-t border-line bg-canvas p-2">
                {y.months.map((g) => <MonthCard key={g.key} g={g} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
