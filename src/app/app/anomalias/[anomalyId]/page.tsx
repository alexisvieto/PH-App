import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AnomalyStatusControl } from "@/components/forms/anomaly-status-control";
import { formatDate } from "@/lib/format";
import { ANOMALY_STATUS_CLASS, ANOMALY_STATUS_LABEL } from "@/lib/maintenance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 60 * 60; // 1 hora

export default async function AnomalyDetailPage({
  params,
}: {
  params: Promise<{ anomalyId: string }>;
}) {
  const { anomalyId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: anomaly } = await supabase
    .from("anomaly_reports")
    .select("id, title, description, status, building_id, equipment_id, supplier_id, created_at")
    .eq("id", anomalyId)
    .maybeSingle();
  if (!anomaly) notFound();

  const [{ data: buildings }, { data: equipment }, { data: suppliers }, { data: photos }] =
    await Promise.all([
      supabase.from("buildings").select("id, name").eq("organization_id", orgId),
      supabase.from("equipment").select("id, name").eq("organization_id", orgId),
      supabase.from("suppliers").select("id, name").eq("organization_id", orgId),
      supabase
        .from("anomaly_photos")
        .select("id, storage_path, sort_order")
        .eq("anomaly_id", anomalyId)
        .order("sort_order", { ascending: true }),
    ]);

  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const equipmentName = new Map((equipment ?? []).map((e) => [e.id, e.name]));
  const supplierName = new Map((suppliers ?? []).map((s) => [s.id, s.name]));

  // Bucket privado → URLs firmadas server-side (una llamada para todas).
  const paths = (photos ?? []).map((p) => p.storage_path);
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("ph-photos")
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? [])
      if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/app/anomalias"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Volver a anomalías
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{anomaly.title}</h1>
            <p className="text-sm text-muted">
              {buildingName.get(anomaly.building_id) ?? "—"}
              {anomaly.equipment_id
                ? ` · ${equipmentName.get(anomaly.equipment_id) ?? "Equipo"}`
                : ""}
              {" · "}
              {formatDate(anomaly.created_at)}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${ANOMALY_STATUS_CLASS[anomaly.status]}`}
          >
            {ANOMALY_STATUS_LABEL[anomaly.status]}
          </span>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm">{anomaly.description}</p>

        {anomaly.supplier_id && (
          <p className="mt-3 text-sm text-muted">
            Proveedor sugerido:{" "}
            <span className="font-medium text-ink">
              {supplierName.get(anomaly.supplier_id) ?? "—"}
            </span>
          </p>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <AnomalyStatusControl anomalyId={anomaly.id} current={anomaly.status} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Evidencia</h2>
        {(photos ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Sin fotos adjuntas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(photos ?? []).map((p) => {
              const url = signedByPath.get(p.storage_path);
              if (!url) {
                return (
                  <div
                    key={p.id}
                    className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-line bg-gray-50 p-2 text-center text-xs text-muted"
                  >
                    Foto no disponible
                  </div>
                );
              }
              return (
                <a
                  key={p.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-square overflow-hidden rounded-xl border border-line bg-gray-50"
                >
                  <Image
                    src={url}
                    alt="Evidencia de la anomalía"
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
