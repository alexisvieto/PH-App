import Link from "next/link";
import { PieChart, Users } from "lucide-react";

import { MonthPicker } from "@/components/portal/month-picker";
import { formatMoney } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const CAT_LABEL: Record<string, string> = {
  servicios: "Servicios",
  mantenimiento: "Mantenimiento",
  personal: "Personal",
  administrativo: "Administrativo",
  seguros: "Seguros",
  reserva: "Fondo de reserva",
  otro: "Otro",
};

type ExpenseItem = {
  category: string;
  description: string | null;
  supplier: string | null;
  amount: number;
  spent_on: string;
};
type Summary = {
  income: number;
  expenses: ExpenseItem[];
  operationalTotal: number;
  personnelTotal: number;
  expensesTotal: number;
  net: number;
};

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(lastDay).padStart(2, "0")}` };
}

export default async function PortalFinanzas({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const res = await getResidentContext();
  if (!res?.orgId) return null;
  const sp = await searchParams;

  // Mes actual en hora de Panamá.
  const panamaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Panama" }));
  const curY = panamaNow.getFullYear();
  const curM = panamaNow.getMonth() + 1;
  const defaultYm = `${curY}-${String(curM).padStart(2, "0")}`;
  const ym = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? (sp.m as string) : defaultYm;

  // Últimos 12 meses para el selector.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(curY, curM - 1 - i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    };
  });

  const { from, to } = monthRange(ym);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_finance_summary", { p_org: res.orgId, p_from: from, p_to: to });
  const s = (data ?? null) as Summary | null;

  const income = s?.income ?? 0;
  const expensesTotal = s?.expensesTotal ?? 0;
  const personnel = s?.personnelTotal ?? 0;
  const items = s?.expenses ?? [];
  const net = s?.net ?? 0;
  const hasMovs = income > 0 || expensesTotal > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <PieChart className="size-6 text-brand" /> Finanzas del PH
          </h1>
          <MonthPicker months={months} value={ym} />
        </div>
        <p className="text-sm text-muted">Cómo se mueve el dinero del edificio: lo que entra y lo que se gasta.</p>
      </div>

      {/* Ingresos vs Egresos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Ingresos (recaudado)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">{formatMoney(income)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Egresos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{formatMoney(expensesTotal)}</p>
        </div>
      </div>

      {/* Balance del mes */}
      <div
        className={`rounded-2xl border p-4 ${
          net >= 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Balance del mes</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${net >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
          {formatMoney(net)}
        </p>
        <p className="mt-0.5 text-xs text-muted">Ingresos menos egresos del período.</p>
      </div>

      {!hasMovs ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay movimientos registrados este mes.
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="font-semibold">En qué se gastó</h2>
          <div className="space-y-2">
            {items.map((e, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-medium">{e.description || CAT_LABEL[e.category] || "Gasto"}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {CAT_LABEL[e.category] ?? e.category}
                    {e.supplier ? ` · ${e.supplier}` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{formatMoney(e.amount)}</span>
              </div>
            ))}

            {/* Personal / nómina como un solo total (privacidad de salarios) */}
            {personnel > 0 && (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Users className="size-4 text-muted" /> Personal / nómina
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Sueldos y cargas del personal (total, sin detalle por persona).</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{formatMoney(personnel)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <p className="text-center text-xs text-muted">
        Por privacidad, los salarios del personal se muestran como un total, no individualmente.
      </p>
    </div>
  );
}
