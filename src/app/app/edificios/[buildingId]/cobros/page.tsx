import Link from "next/link";
import { notFound } from "next/navigation";

import { FeeSettingsForm } from "@/components/forms/fee-settings-form";
import { GenerateChargesForm } from "@/components/forms/generate-charges-form";
import { formatDate, formatMoney } from "@/lib/format";
import { CHARGE_CONCEPT_LABEL, periodLabel } from "@/lib/finance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function CobrosPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { buildingId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: building } = await supabase
    .from("buildings")
    .select("id, name")
    .eq("id", buildingId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!building) notFound();

  const [{ data: fee }, { data: charges }] = await Promise.all([
    supabase
      .from("fee_settings")
      .select("method, base_amount")
      .eq("building_id", buildingId)
      .maybeSingle(),
    supabase
      .from("charges")
      .select(
        "id, concept, period, amount, due_date, unit:units!charges_unit_id_fkey(code)",
      )
      .eq("building_id", buildingId)
      .order("period", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const list = charges ?? [];
  const total = list.reduce((a, c) => a + Number(c.amount ?? 0), 0);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/app/edificios/${buildingId}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {building.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Cobros</h1>
        <p className="text-sm text-muted">
          Configura la cuota y genera los cargos del mes.
        </p>
      </div>

      <FeeSettingsForm
        buildingId={buildingId}
        method={fee?.method ?? null}
        baseAmount={fee?.base_amount ?? null}
      />

      <GenerateChargesForm
        buildingId={buildingId}
        hasSettings={!!fee}
        defaultMonth={defaultMonth}
      />

      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold">Cargos</h2>
          <span className="text-sm text-muted">
            {list.length} cargos · {formatMoney(total)}
          </span>
        </div>
        {list.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Aún no hay cargos. Genera las cuotas del mes arriba.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Mes</th>
                <th className="px-5 py-3 font-medium">Unidad</th>
                <th className="px-5 py-3 font-medium">Concepto</th>
                <th className="px-5 py-3 font-medium">Monto</th>
                <th className="px-5 py-3 font-medium">Vence</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-muted">{periodLabel(c.period)}</td>
                  <td className="px-5 py-3 font-medium">
                    {(c.unit as { code: string } | null)?.code ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {CHARGE_CONCEPT_LABEL[c.concept]}
                  </td>
                  <td className="px-5 py-3">{formatMoney(c.amount)}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(c.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
