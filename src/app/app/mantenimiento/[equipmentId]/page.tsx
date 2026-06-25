import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { LogMaintenanceForm } from "@/components/forms/log-maintenance-form";
import { MarkAttendedButton } from "@/components/forms/mark-attended-button";
import { formatDate, formatMoney } from "@/lib/format";
import {
  EQUIPMENT_CATEGORY_LABEL,
  EQUIPMENT_STATUS_CLASS,
  EQUIPMENT_STATUS_LABEL,
  maintenanceAlert,
} from "@/lib/maintenance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: equipment } = await supabase
    .from("equipment")
    .select(
      "id, name, category, status, location, quantity, serial_number, notes, building_id, supplier_id, maintenance_frequency_days, next_maintenance",
    )
    .eq("id", equipmentId)
    .maybeSingle();
  if (!equipment) notFound();

  const [{ data: buildings }, { data: suppliers }, { data: logs }] =
    await Promise.all([
      supabase.from("buildings").select("id, name").eq("organization_id", orgId),
      supabase
        .from("suppliers")
        .select("id, name")
        .eq("organization_id", orgId)
        .order("name", { ascending: true }),
      supabase
        .from("maintenance_logs")
        .select("id, performed_on, description, cost, supplier_id")
        .eq("equipment_id", equipmentId)
        .order("performed_on", { ascending: false })
        .limit(100),
    ]);

  const supplierName = new Map((suppliers ?? []).map((s) => [s.id, s.name]));
  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const alert = maintenanceAlert(equipment.next_maintenance);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/app/mantenimiento"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Volver a mantenimiento
        </Link>
        <Link
          href={`/app/anomalias?equipment=${equipment.id}&building=${equipment.building_id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <AlertTriangle className="size-4" /> Reportar anomalía
        </Link>
      </div>

      {(alert.kind === "vencido" || alert.kind === "proximo") && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
            alert.kind === "vencido" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className={`text-sm font-medium ${alert.kind === "vencido" ? "text-red-700" : "text-amber-800"}`}>
            {alert.kind === "vencido" ? "Mantenimiento vencido." : "Mantenimiento próximo."} Cuando lo realices, márcalo
            como atendido para limpiar la alerta.
          </p>
          <MarkAttendedButton equipmentId={equipmentId} />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{equipment.name}</h1>
            <p className="text-sm text-muted">
              {EQUIPMENT_CATEGORY_LABEL[equipment.category]} ·{" "}
              {buildingName.get(equipment.building_id) ?? "—"}
              {equipment.location ? ` · ${equipment.location}` : ""}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${EQUIPMENT_STATUS_CLASS[equipment.status]}`}
          >
            {EQUIPMENT_STATUS_LABEL[equipment.status]}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Cantidad</dt>
            <dd className="font-medium">{equipment.quantity}</dd>
          </div>
          <div>
            <dt className="text-muted">Serie</dt>
            <dd className="font-medium">{equipment.serial_number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Proveedor</dt>
            <dd className="font-medium">
              {equipment.supplier_id ? supplierName.get(equipment.supplier_id) ?? "—" : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Frecuencia</dt>
            <dd className="font-medium">
              {equipment.maintenance_frequency_days
                ? `${equipment.maintenance_frequency_days} días`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Próximo mantenimiento</dt>
            <dd className="font-medium">{formatDate(equipment.next_maintenance)}</dd>
          </div>
          <div>
            <dt className="text-muted">Alerta</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${alert.className}`}
              >
                {alert.label}
              </span>
            </dd>
          </div>
        </dl>

        {equipment.notes && (
          <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-muted">
            {equipment.notes}
          </p>
        )}
      </div>

      <LogMaintenanceForm equipmentId={equipmentId} suppliers={suppliers ?? []} />

      <div>
        <h2 className="mb-3 font-semibold">Historial de mantenimientos</h2>
        {(logs ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Aún no hay mantenimientos registrados.
          </p>
        ) : (
          <ul className="space-y-3">
            {(logs ?? []).map((log) => (
              <li
                key={log.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{formatDate(log.performed_on)}</span>
                  {log.cost !== null && (
                    <span className="text-sm text-muted">{formatMoney(log.cost)}</span>
                  )}
                </div>
                <p className="mt-1 text-sm">{log.description}</p>
                {log.supplier_id && (
                  <p className="mt-1 text-xs text-muted">
                    {supplierName.get(log.supplier_id) ?? "Proveedor"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
