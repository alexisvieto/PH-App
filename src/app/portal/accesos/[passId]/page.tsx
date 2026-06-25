import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";

import { anularResidentPass } from "@/app/portal/accesos/actions";
import { AnularPassButton } from "@/components/access/anular-pass-button";
import { SharePassButton } from "@/components/access/share-pass-button";
import { PASS_TYPE_LABEL, passState, vigenciaText, WEEKDAYS } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalPassDetail({
  params,
}: {
  params: Promise<{ passId: string }>;
}) {
  const { passId } = await params;
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data: pass } = await supabase
    .from("visitor_passes")
    .select("*")
    .eq("id", passId)
    .maybeSingle();
  if (!pass) notFound();

  const { data: unit } = await supabase.from("units").select("code").eq("id", pass.unit_id).maybeSingle();
  const st = passState(pass);
  const qrDataUrl = await QRCode.toDataURL(pass.code, { width: 280, margin: 1 });
  const validez = pass.valid_to ? `${formatDate(pass.valid_from)} a ${formatDate(pass.valid_to)}` : "indefinido";
  const msg = `Pase de visita — ${pass.visitor_name}\nCódigo: ${pass.code}\nUnidad: ${unit?.code ?? ""}\nVálido: ${validez}\nPresenta este código en la garita.`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  return (
    <div className="space-y-6">
      <Link href="/portal/accesos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Volver
      </Link>

      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Código QR del pase" className="mx-auto size-48 rounded-xl border border-line" />
        <p className="mt-3 text-xs uppercase tracking-wide text-muted">Código</p>
        <p className="font-mono text-3xl font-bold tracking-widest">{pass.code}</p>
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <SharePassButton qrDataUrl={qrDataUrl} code={pass.code} shareText={msg} waLink={waLink} />
          {pass.status === "activo" && <AnularPassButton passId={pass.id} action={anularResidentPass} />}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 text-left text-sm sm:grid-cols-2">
          <Field label="Visitante" value={pass.visitor_name} />
          <Field label="Unidad" value={unit?.code ?? "—"} />
          <Field label="Tipo" value={PASS_TYPE_LABEL[pass.type]} />
          <Field label="Vigencia" value={vigenciaText(pass.valid_from, pass.valid_to)} />
          {pass.recurring_days && pass.recurring_days.length > 0 && (
            <Field label="Días" value={pass.recurring_days.map((d) => WEEKDAYS[d]).join(", ")} />
          )}
          {pass.vehicle_plate && <Field label="Placa" value={pass.vehicle_plate} />}
        </dl>
      </div>
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
