import Link from "next/link";
import { AlertTriangle, Camera } from "lucide-react";

import { NewAnomalyForm } from "@/components/forms/new-anomaly-form";
import { formatDate } from "@/lib/format";
import { ANOMALY_STATUS_CLASS, ANOMALY_STATUS_LABEL } from "@/lib/maintenance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const STATUS_ORDER = { abierta: 0, resuelta: 1 } as const;

export default async function AnomaliasPage({
  searchParams,
}: {
  searchParams: Promise<{ equipment?: string; building?: string }>;
}) {
  const { equipment: equipmentParam, building: buildingParam } = await searchParams;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  // Sin embeds (FK compuestas): se traen catálogos y se mapean por id.
  const [{ data: anomalies }, { data: buildings }, { data: equipment }, { data: suppliers }, { data: photos }] =
    await Promise.all([
      supabase
        .from("anomaly_reports")
        .select("id, title, status, building_id, equipment_id, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
      supabase.from("equipment").select("id, name").eq("organization_id", orgId).order("name"),
      supabase.from("suppliers").select("id, name").eq("organization_id", orgId).order("name"),
      supabase.from("anomaly_photos").select("anomaly_id").eq("organization_id", orgId).limit(2000),
    ]);

  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const equipmentName = new Map((equipment ?? []).map((e) => [e.id, e.name]));
  const photoCount = new Map<string, number>();
  for (const p of photos ?? [])
    photoCount.set(p.anomaly_id, (photoCount.get(p.anomaly_id) ?? 0) + 1);

  const list = (anomalies ?? []).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
  const openCount = list.filter((a) => a.status === "abierta").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Anomalías</h1>
          <p className="text-sm text-muted">
            Reportes de fallas y daños, con fotos de evidencia.
          </p>
        </div>
        <NewAnomalyForm
          buildings={buildings ?? []}
          equipment={equipment ?? []}
          suppliers={suppliers ?? []}
          defaultEquipmentId={
            equipmentParam && (equipment ?? []).some((e) => e.id === equipmentParam)
              ? equipmentParam
              : ""
          }
          defaultBuildingId={
            buildingParam && (buildings ?? []).some((b) => b.id === buildingParam)
              ? buildingParam
              : ""
          }
        />
      </div>

      {openCount > 0 && (
        <span className="inline-block rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          {openCount} anomalía(s) abierta(s)
        </span>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">No hay anomalías reportadas</p>
          <p className="text-sm text-muted">Reporta la primera con “Reportar anomalía”.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/app/anomalias/${a.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {a.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {buildingName.get(a.building_id) ?? "—"}
                    {a.equipment_id ? ` · ${equipmentName.get(a.equipment_id) ?? "Equipo"}` : ""}
                    {" · "}
                    {formatDate(a.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {(photoCount.get(a.id) ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <Camera className="size-3.5" /> {photoCount.get(a.id)}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ANOMALY_STATUS_CLASS[a.status]}`}
                  >
                    {ANOMALY_STATUS_LABEL[a.status]}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
