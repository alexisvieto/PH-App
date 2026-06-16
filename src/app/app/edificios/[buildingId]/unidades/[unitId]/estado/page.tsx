import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { NewChargeForm } from "@/components/forms/new-charge-form";
import { NewPaymentForm } from "@/components/forms/new-payment-form";
import { formatDate, formatMoney } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { getUnitStatement } from "@/lib/statement";

export default async function EstadoCuentaPage({
  params,
}: {
  params: Promise<{ buildingId: string; unitId: string }>;
}) {
  const { buildingId, unitId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const st = await getUnitStatement(unitId, orgId);
  if (!st) notFound();

  const owes = st.balance > 0.005;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/app/edificios/${buildingId}/unidades/${unitId}`}
            className="text-sm text-muted hover:text-ink"
          >
            ← Unidad {st.unitCode}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Estado de cuenta</h1>
          <p className="text-sm text-muted">
            {st.buildingName} · Unidad {st.unitCode}
            {st.ownerName ? ` · ${st.ownerName}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/app/edificios/${buildingId}/unidades/${unitId}/estado/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            <Download className="size-4" /> Estado PDF
          </a>
          {owes ? (
            <span
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted opacity-60"
              title="No se puede emitir con saldo pendiente"
            >
              Paz y salvo
            </span>
          ) : (
            <a
              href={`/app/edificios/${buildingId}/unidades/${unitId}/estado/paz-y-salvo`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-soft/40"
            >
              Paz y salvo
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Cargos" value={formatMoney(st.totalCharges)} />
        <Stat label="Pagos" value={formatMoney(st.totalPayments)} />
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p
            className={`text-2xl font-semibold ${owes ? "text-red-600" : "text-emerald-600"}`}
          >
            {formatMoney(st.balance)}
          </p>
          <p className="text-sm text-muted">
            {owes ? "Saldo pendiente" : "Al día"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <NewPaymentForm unitId={unitId} defaultDate={today} />
        <NewChargeForm unitId={unitId} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
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
            {st.movements.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Sin movimientos todavía.
                </td>
              </tr>
            ) : (
              st.movements.map((m, i) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
