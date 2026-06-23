import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { SharePdfButton } from "@/components/portal/share-pdf-button";
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
  // El hero comunica el estado por color: marca (al día) o cálido (pendiente).
  const heroBg = owes
    ? "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)"
    : `linear-gradient(135deg, ${st.brand.primary} 0%, ${st.brand.accent} 100%)`;

  return (
    <div className="space-y-6">
      <Link href="/portal" className="text-sm text-muted hover:text-ink">
        ← Inicio
      </Link>

      {/* Hero: el saldo como protagonista, con color según el estado */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
        style={{ background: heroBg }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-wide text-white/80">
            {owes ? "Saldo pendiente" : "Tu saldo"}
          </p>
          {owes ? (
            <p className="mt-1 text-4xl font-bold tabular-nums">
              {formatMoney(st.balance)}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
              <CheckCircle2 className="size-7" /> Estás al día
            </p>
          )}
          <p className="mt-2 text-sm text-white/85">
            {st.buildingName} · Unidad {st.unitCode}
          </p>
        </div>
      </section>

      {/* Acciones: comparten/guardan el PDF con la bandeja nativa del sistema */}
      <div className="flex flex-wrap gap-2">
        <SharePdfButton
          url={`/portal/unidades/${unitId}/pdf`}
          filename={`estado-cuenta-${st.unitCode}.pdf`}
          title={`Estado de cuenta · Unidad ${st.unitCode}`}
          label="Compartir estado de cuenta"
        />
        {!owes && (
          <SharePdfButton
            url={`/portal/unidades/${unitId}/paz-y-salvo`}
            filename={`paz-y-salvo-${st.unitCode}.pdf`}
            title={`Paz y salvo · Unidad ${st.unitCode}`}
            label="Compartir paz y salvo"
            variant="solid"
          />
        )}
      </div>

      {/* Totales (el saldo ya va en el hero) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-lg font-semibold tabular-nums leading-tight sm:text-xl">
            {formatMoney(st.totalCharges)}
          </p>
          <p className="text-xs text-muted">Total de cargos</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-lg font-semibold tabular-nums leading-tight text-emerald-600 sm:text-xl">
            {formatMoney(st.totalPayments)}
          </p>
          <p className="text-xs text-muted">Total de pagos</p>
        </div>
      </div>

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
