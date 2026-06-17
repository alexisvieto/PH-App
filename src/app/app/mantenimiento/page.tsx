import Link from "next/link";
import { Wrench } from "lucide-react";

import { NewEquipmentForm } from "@/components/forms/new-equipment-form";
import { formatDate } from "@/lib/format";
import {
  EQUIPMENT_CATEGORY_LABEL,
  EQUIPMENT_STATUS_CLASS,
  EQUIPMENT_STATUS_LABEL,
  maintenanceAlert,
} from "@/lib/maintenance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const ALERT_ORDER = { vencido: 0, proximo: 1, sin_programar: 2, ok: 3 } as const;

export default async function MantenimientoPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  // Sin embeds: equipment→buildings/suppliers tienen FK compuesta, mapeamos por id.
  const [{ data: equipment }, { data: buildings }, { data: suppliers }] =
    await Promise.all([
      supabase
        .from("equipment")
        .select(
          "id, name, category, status, location, quantity, building_id, supplier_id, next_maintenance",
        )
        .eq("organization_id", orgId)
        .order("name", { ascending: true })
        .limit(300),
      supabase
        .from("buildings")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name", { ascending: true }),
      supabase
        .from("suppliers")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name", { ascending: true }),
    ]);

  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const list = (equipment ?? [])
    .map((e) => ({ ...e, alert: maintenanceAlert(e.next_maintenance) }))
    .sort((a, b) => ALERT_ORDER[a.alert.kind] - ALERT_ORDER[b.alert.kind]);

  const overdue = list.filter((e) => e.alert.kind === "vencido").length;
  const soon = list.filter((e) => e.alert.kind === "proximo").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mantenimiento e inventario</h1>
          <p className="text-sm text-muted">
            Equipos del PH, su estado y próximos mantenimientos.
          </p>
        </div>
        <NewEquipmentForm
          buildings={buildings ?? []}
          suppliers={suppliers ?? []}
        />
      </div>

      {(overdue > 0 || soon > 0) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {overdue > 0 && (
            <span className="rounded-lg bg-red-50 px-3 py-2 font-medium text-red-700">
              {overdue} mantenimiento(s) vencido(s)
            </span>
          )}
          {soon > 0 && (
            <span className="rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-700">
              {soon} próximo(s) a vencer
            </span>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Wrench className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Aún no hay equipos registrados</p>
          <p className="text-sm text-muted">Agrega el primero con “Nuevo equipo”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3 font-medium">Edificio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Próximo</th>
                <th className="px-4 py-3 font-medium">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/mantenimiento/${e.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {e.name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {EQUIPMENT_CATEGORY_LABEL[e.category]}
                      {e.location ? ` · ${e.location}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {buildingName.get(e.building_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${EQUIPMENT_STATUS_CLASS[e.status]}`}
                    >
                      {EQUIPMENT_STATUS_LABEL[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(e.next_maintenance)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.alert.className}`}
                    >
                      {e.alert.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
