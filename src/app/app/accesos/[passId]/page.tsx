import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import QRCode from "qrcode";

import { anularPass } from "@/app/app/accesos/actions";
import { AnularPassButton } from "@/components/access/anular-pass-button";
import { LOG_DIRECTION_LABEL, PASS_TYPE_LABEL, passState, WEEKDAYS } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PassDetailPage({
  params,
}: {
  params: Promise<{ passId: string }>;
}) {
  const { passId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: pass } = await supabase
    .from("visitor_passes")
    .select("*")
    .eq("id", passId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!pass) notFound();

  const [{ data: unit }, { data: logs }] = await Promise.all([
    supabase.from("units").select("code").eq("id", pass.unit_id).maybeSingle(),
    supabase
      .from("visitor_log")
      .select("id, direction, occurred_at")
      .eq("pass_id", passId)
      .order("occurred_at", { ascending: false })
      .limit(20),
  ]);

  const st = passState(pass);
  const qrDataUrl = await QRCode.toDataURL(pass.code, { width: 280, margin: 1 });

  const msg = `Pase de visita — ${pass.visitor_name}\nCódigo: ${pass.code}\nUnidad: ${unit?.code ?? ""}\nVálido: ${formatDate(pass.valid_from)} a ${formatDate(pass.valid_to)}\nPresenta este código en la garita.`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/app/accesos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver a accesos
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Código QR del pase" className="size-44 rounded-xl border border-line" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs uppercase tracking-wide text-muted">Código</p>
            <p className="font-mono text-3xl font-bold tracking-widest">{pass.code}</p>
            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                <MessageCircle className="size-4" /> Compartir por WhatsApp
              </a>
              {pass.status === "activo" && <AnularPassButton passId={pass.id} action={anularPass} />}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 text-sm sm:grid-cols-2 md:grid-cols-3">
          <Field label="Visitante" value={pass.visitor_name} />
          <Field label="Documento" value={pass.visitor_doc ?? "—"} />
          <Field label="Unidad" value={unit?.code ?? "—"} />
          <Field label="Tipo" value={PASS_TYPE_LABEL[pass.type]} />
          <Field label="Vigencia" value={`${formatDate(pass.valid_from)} — ${formatDate(pass.valid_to)}`} />
          <Field label="Usos" value={pass.max_uses === null ? `${pass.uses_count} (ilimitado)` : `${pass.uses_count} / ${pass.max_uses}`} />
          {pass.recurring_days && pass.recurring_days.length > 0 && (
            <Field label="Días" value={pass.recurring_days.map((d) => WEEKDAYS[d]).join(", ")} />
          )}
          {(pass.time_from || pass.time_to) && (
            <Field label="Horario" value={`${pass.time_from ?? ""}–${pass.time_to ?? ""}`} />
          )}
          {pass.vehicle_plate && <Field label="Placa" value={pass.vehicle_plate} />}
        </dl>
      </div>

      {(logs ?? []).length > 0 && (
        <div className="rounded-2xl border border-line bg-surface">
          <h2 className="border-b border-line px-5 py-3 font-semibold">Entradas/salidas de este pase</h2>
          <ul className="divide-y divide-line">
            {(logs ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className={l.direction === "entrada" ? "text-emerald-700" : "text-gray-500"}>
                  {LOG_DIRECTION_LABEL[l.direction]}
                </span>
                <span className="text-muted">
                  {new Date(l.occurred_at).toLocaleString("es-PA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Panama" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
