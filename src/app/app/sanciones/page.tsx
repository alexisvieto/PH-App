import Link from "next/link";
import { FileDown, Gavel } from "lucide-react";

import { NewInfractionForm } from "@/components/forms/new-infraction-form";
import { formatDate, formatMoney } from "@/lib/format";
import { canManage, getSessionContext } from "@/lib/session";
import { INFRACTION_TYPE_CLASS, INFRACTION_TYPE_LABEL } from "@/lib/sanctions";
import { createClient } from "@/lib/supabase/server";

export default async function SancionesPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  // FK compuestas → sin embed; se mapea por id.
  const [{ data: infractions }, { data: units }, { data: buildings }] =
    await Promise.all([
      supabase
        .from("infractions")
        .select("id, type, reason, amount, infraction_date, unit_id")
        .eq("organization_id", orgId)
        .order("infraction_date", { ascending: false })
        .limit(300),
      supabase
        .from("units")
        .select("id, code, building_id")
        .eq("organization_id", orgId)
        .order("code"),
      supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
    ]);

  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const unitInfo = new Map(
    (units ?? []).map((u) => [
      u.id,
      { code: u.code, building: buildingName.get(u.building_id) ?? "—" },
    ]),
  );
  const unitOptions = (units ?? []).map((u) => ({
    id: u.id,
    label: `${buildingName.get(u.building_id) ?? "Edificio"} · ${u.code}`,
  }));

  const list = infractions ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Multas y llamados de atención</h1>
          <p className="text-sm text-muted">
            Sanciones por unidad. Las multas generan un cargo en el estado de cuenta.
          </p>
        </div>
        <NewInfractionForm units={unitOptions} canFine={canManage(ctx.role)} />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Gavel className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Sin sanciones registradas</p>
          <p className="text-sm text-muted">Registra la primera con “Nueva sanción”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((i) => {
                const u = unitInfo.get(i.unit_id);
                return (
                  <tr key={i.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-muted">{formatDate(i.infraction_date)}</td>
                    <td className="px-4 py-3">
                      {u ? `${u.building} · ${u.code}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${INFRACTION_TYPE_CLASS[i.type]}`}
                      >
                        {INFRACTION_TYPE_LABEL[i.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{i.reason}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      {i.amount !== null ? formatMoney(i.amount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/app/sanciones/${i.id}/pdf`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                      >
                        <FileDown className="size-3.5" /> Formato
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
