import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { StatementMovements } from "@/components/portal/statement-movements";
import { BALANCE_TOLERANCE } from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import { getUnitStatement } from "@/lib/statement";

export default async function PortalEstado({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const st = await getUnitStatement(unitId);
  if (!st) notFound();

  const owes = st.balance > BALANCE_TOLERANCE;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/portal" className="text-sm text-muted hover:text-ink">
            ← Inicio
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Estado de cuenta</h1>
          <p className="text-sm text-muted">
            {st.buildingName} · Unidad {st.unitCode}
          </p>
        </div>
        <a
          href={`/portal/unidades/${unitId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          <Download className="size-4" /> PDF
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
          <p className="text-base font-semibold tabular-nums leading-tight sm:text-xl">
            {formatMoney(st.totalCharges)}
          </p>
          <p className="text-xs text-muted">Cargos</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
          <p className="text-base font-semibold tabular-nums leading-tight sm:text-xl">
            {formatMoney(st.totalPayments)}
          </p>
          <p className="text-xs text-muted">Pagos</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
          <p
            className={`text-base font-semibold tabular-nums leading-tight sm:text-xl ${owes ? "text-red-600" : "text-emerald-600"}`}
          >
            {formatMoney(st.balance)}
          </p>
          <p className="text-xs text-muted">{owes ? "Pendiente" : "Al día"}</p>
        </div>
      </div>

      {!owes && (
        <a
          href={`/portal/unidades/${unitId}/paz-y-salvo`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Download className="size-4" /> Descargar mi paz y salvo
        </a>
      )}

      {st.movements.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          Sin movimientos todavía.
        </p>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 text-right font-medium">Cargo</th>
                  <th className="px-4 py-3 text-right font-medium">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {st.movements.map((m, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-muted">{formatDate(m.date)}</td>
                    <td className="px-4 py-3">{m.concept}</td>
                    <td className="px-4 py-3 text-right">
                      {m.debit ? formatMoney(m.debit) : ""}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700">
                      {m.credit ? formatMoney(m.credit) : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(m.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: tarjetas apiladas por mes (años pasados, acordeón anual) */}
          <div className="md:hidden">
            <StatementMovements movements={st.movements} />
          </div>
        </>
      )}
    </div>
  );
}
