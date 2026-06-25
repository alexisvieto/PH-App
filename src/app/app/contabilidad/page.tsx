import Link from "next/link";
import { BookOpenCheck, CheckCircle2, FileText, ListTree, TriangleAlert } from "lucide-react";

import { MonthPicker } from "@/components/portal/month-picker";
import { getAccountingStatements } from "@/lib/accounting";
import { formatMoney } from "@/lib/format";
import { getSessionContext } from "@/lib/session";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(lastDay).padStart(2, "0")}`, y, m };
}

export default async function ContabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  const sp = await searchParams;

  const panamaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Panama" }));
  const curY = panamaNow.getFullYear();
  const curM = panamaNow.getMonth() + 1;
  const defaultYm = `${curY}-${String(curM).padStart(2, "0")}`;
  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.m ?? "") ? (sp.m as string) : defaultYm;
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(curY, curM - 1 - i, 1));
    return {
      value: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    };
  });

  const { from, to } = monthRange(ym);
  const { income, balance } = await getAccountingStatements(orgId, from, to);
  const monthLabel = months.find((x) => x.value === ym)?.label ?? ym;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <BookOpenCheck className="size-6 text-brand" /> Contabilidad
          </h1>
          <p className="text-sm text-muted">Estados financieros generados del libro (partida doble).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker months={months} value={ym} basePath="/app/contabilidad" />
          <Link
            href="/app/contabilidad/cuentas"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            <ListTree className="size-4" /> Catálogo
          </Link>
          <a
            href={`/app/contabilidad/informe?m=${ym}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <FileText className="size-4" /> Informe mensual
          </a>
        </div>
      </div>

      {/* Cuadre del libro */}
      {balance.cuadra ? (
        <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> El libro cuadra · Activos = Pasivos + Patrimonio
        </p>
      ) : (
        <p className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          <TriangleAlert className="size-4" /> El libro NO cuadra — revisar
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Estado de Resultados */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Estado de Resultados</h2>
          <p className="text-xs text-muted">{monthLabel}</p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Ingresos</p>
          <StatementLines lines={income.ingresos} total={income.totalIngresos} totalLabel="Total ingresos" />

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Gastos</p>
          <StatementLines lines={income.gastos} total={income.totalGastos} totalLabel="Total gastos" />

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="font-semibold">Resultado del mes</span>
            <span className={`font-bold tabular-nums ${income.resultado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatMoney(income.resultado)}
            </span>
          </div>
        </section>

        {/* Balance General */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Balance General</h2>
          <p className="text-xs text-muted">al {to}</p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Activos</p>
          <StatementLines lines={balance.activos} total={balance.totalActivos} totalLabel="Total activos" />

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Pasivos</p>
          <StatementLines lines={balance.pasivos} total={balance.totalPasivos} totalLabel="Total pasivos" />

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Patrimonio</p>
          <StatementLines lines={balance.patrimonio} total={balance.totalPatrimonio} totalLabel="Total patrimonio" />

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm text-muted">
            <span>Pasivos + Patrimonio</span>
            <span className="tabular-nums">{formatMoney(balance.totalPasivos + balance.totalPatrimonio)}</span>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-muted">
        Cada cuota, pago, gasto, multa y recargo genera su asiento automáticamente. El Fondo de Imprevistos y los
        recargos por morosidad se calculan según la configuración del PH.
      </p>
    </div>
  );
}

function StatementLines({
  lines,
  total,
  totalLabel,
}: {
  lines: { code: string; name: string; amount: number }[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div className="mt-1">
      {lines.length === 0 ? (
        <p className="py-1 text-sm text-muted">—</p>
      ) : (
        lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-1 text-sm">
            <span className="min-w-0">
              {l.code !== "—" && <span className="mr-1.5 font-mono text-xs text-muted">{l.code}</span>}
              {l.name}
            </span>
            <span className="shrink-0 tabular-nums">{formatMoney(l.amount)}</span>
          </div>
        ))
      )}
      <div className="mt-1 flex items-center justify-between border-t border-line pt-1 text-sm font-medium">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{formatMoney(total)}</span>
      </div>
    </div>
  );
}
