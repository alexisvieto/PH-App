import Link from "next/link";
import { notFound } from "next/navigation";

import { VotationAdminControls } from "@/components/votaciones/votation-admin-controls";
import { VotationResults } from "@/components/votaciones/votation-results";
import { VOTATION_STATUS_LABEL, VOTATION_STATUS_STYLE, tally } from "@/lib/votations";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

function dt(ts: string | null) {
  return ts
    ? new Date(ts).toLocaleString("es-PA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Panama" })
    : "—";
}

export default async function VotacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: v } = await supabase
    .from("votations")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!v) notFound();

  const [{ data: options }, { data: votes }, { data: units }] = await Promise.all([
    supabase.from("votation_options").select("id, label, sort_order").eq("votation_id", id).order("sort_order"),
    supabase.from("votation_votes").select("unit_id, option_id, is_abstention, weight, voted_at").eq("votation_id", id),
    supabase.from("units").select("id, code, coefficient").eq("building_id", v.building_id),
  ]);

  const opts = options ?? [];
  const allVotes = votes ?? [];
  const totalCoef = (units ?? []).reduce((s, u) => s + Number(u.coefficient ?? 0), 0);
  const t = tally(opts, allVotes, totalCoef, Number(v.quorum_pct), Number(v.approval_pct), v.kind);

  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const optionLabel = new Map(opts.map((o) => [o.id, o.label]));
  const nominal = [...allVotes].sort((a, b) => (a.voted_at < b.voted_at ? 1 : -1));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/app/votaciones" className="text-sm text-muted hover:text-ink">
        ← Votaciones
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{v.title}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VOTATION_STATUS_STYLE[v.status]}`}>
              {VOTATION_STATUS_LABEL[v.status]}
            </span>
          </div>
          {v.description && <p className="mt-1 text-sm text-ink/80">{v.description}</p>}
          <p className="mt-1 text-xs text-muted">
            {v.kind === "si_no" ? "Sí / No" : "Opción múltiple"} · Abre {dt(v.opens_at)} · Cierra {dt(v.closes_at)}
          </p>
        </div>
        <VotationAdminControls votationId={v.id} status={v.status} />
      </div>

      <VotationResults tally={t} quorumPct={Number(v.quorum_pct)} approvalPct={Number(v.approval_pct)} closed={v.status === "cerrada"} />

      {/* Detalle nominal (quién votó qué) */}
      <section className="space-y-2">
        <h2 className="font-semibold">Detalle por unidad</h2>
        {nominal.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Nadie ha votado todavía.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <ul className="divide-y divide-line">
              {nominal.map((vt, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">Unidad {unitCode.get(vt.unit_id) ?? "—"}</span>
                  <span className="flex items-center gap-3">
                    <span>{vt.is_abstention ? "Abstención" : optionLabel.get(vt.option_id ?? "") ?? "—"}</span>
                    <span className="text-xs text-muted">{dt(vt.voted_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
