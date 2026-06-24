import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Package, PackageCheck } from "lucide-react";

import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

function dateTime(ts: string) {
  return new Date(ts).toLocaleString("es-PA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export default async function PortalPaquetes() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  // Gating del módulo pago (igual que /portal/accesos): sin "accesos" → 404.
  const { data: mod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", res.orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();
  if (!mod) notFound();

  const unitIds = res.units.map((u) => u.id);
  const { data: pkgs } = await supabase
    .from("packages")
    .select("id, unit_id, status, courier, notes, photo_path, received_at, delivered_at, delivered_to")
    .in("unit_id", unitIds.length ? unitIds : ["00000000-0000-0000-0000-000000000000"])
    .order("received_at", { ascending: false })
    .limit(100);
  const list = pkgs ?? [];

  const unitCode = new Map(res.units.map((u) => [u.id, u.code]));
  const showUnit = res.units.length > 1;

  // Firmas para las fotos en un solo round trip (el residente lee las de sus
  // paquetes vía la policy aditiva de Storage).
  const photoPaths = list.flatMap((p) => (p.photo_path ? [p.photo_path] : []));
  const photos = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage.from("ph-photos").createSignedUrls(photoPaths, 3600);
    const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    for (const p of list) {
      const url = p.photo_path ? urlByPath.get(p.photo_path) : null;
      if (url) photos.set(p.id, url);
    }
  }

  const pending = list.filter((p) => p.status === "en_garita");
  const delivered = list.filter((p) => p.status === "entregado");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <Package className="size-6 text-amber-600" /> Mis paquetes
        </h1>
        <p className="text-sm text-muted">Paquetes recibidos en garita.</p>
      </div>

      {/* En garita */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Clock className="size-4 text-amber-600" /> En garita
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
            No tienes paquetes esperando.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <article key={p.id} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                {photos.has(p.id) && (
                  <Image
                    src={photos.get(p.id)!}
                    alt="Foto del paquete"
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-xl object-cover"
                    unoptimized
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold">
                    Paquete en garita{showUnit ? ` · Unidad ${unitCode.get(p.unit_id) ?? "—"}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {dateTime(p.received_at)}
                    {p.courier ? ` · ${p.courier}` : ""}
                  </p>
                  {p.notes && <p className="mt-1 text-sm text-ink/80">{p.notes}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Entregados (historial) */}
      {delivered.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-muted">
            <PackageCheck className="size-4" /> Entregados
          </h2>
          <div className="space-y-2">
            {delivered.map((p) => (
              <article
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {showUnit ? `Unidad ${unitCode.get(p.unit_id) ?? "—"}` : "Paquete"}
                    {p.courier ? ` · ${p.courier}` : ""}
                  </p>
                  <p className="text-muted">
                    Entregado {p.delivered_at ? dateTime(p.delivered_at) : ""}
                    {p.delivered_to ? ` · a ${p.delivered_to}` : ""}
                  </p>
                </div>
                <PackageCheck className="size-5 shrink-0 text-emerald-600" />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
