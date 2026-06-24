import Link from "next/link";
import { Vote } from "lucide-react";

import { ABSTAIN, VotePanel } from "@/components/votaciones/vote-panel";
import { VotationResults } from "@/components/votaciones/votation-results";
import { VOTATION_STATUS_LABEL, VOTATION_STATUS_STYLE, tally } from "@/lib/votations";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalVotacionesPage() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const myUnitIds = new Set(res.units.map((u) => u.id));
  const supabase = await createClient();
  const { data: votations } = await supabase
    .from("votations")
    .select("id, title, description, kind, status, building_id, quorum_pct, approval_pct")
    .eq("organization_id", res.orgId)
    .in("status", ["abierta", "cerrada"])
    .order("created_at", { ascending: false })
    .limit(50);

  const ids = (votations ?? []).map((v) => v.id);
  const [{ data: options }, { data: votes }, { data: units }] = await Promise.all([
    ids.length
      ? supabase.from("votation_options").select("id, label, sort_order, votation_id").in("votation_id", ids).order("sort_order")
      : Promise.resolve({ data: [] as { id: string; label: string; sort_order: number; votation_id: string }[] }),
    ids.length
      ? supabase.from("votation_votes").select("votation_id, unit_id, option_id, is_abstention, weight").in("votation_id", ids)
      : Promise.resolve({ data: [] as { votation_id: string; unit_id: string; option_id: string | null; is_abstention: boolean; weight: number }[] }),
    supabase.from("units").select("building_id, coefficient").eq("organization_id", res.orgId),
  ]);

  const totalByBuilding = new Map<string, number>();
  for (const u of units ?? []) {
    totalByBuilding.set(u.building_id, (totalByBuilding.get(u.building_id) ?? 0) + Number(u.coefficient ?? 0));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <Vote className="size-6 text-brand" /> Votaciones
        </h1>
        <p className="text-sm text-muted">Decisiones de la comunidad, ponderadas por coeficiente.</p>
      </div>

      {(votations ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay votaciones por ahora.
        </p>
      ) : (
        <div className="space-y-4">
          {(votations ?? []).map((v) => {
            const opts = (options ?? []).filter((o) => o.votation_id === v.id);
            const vts = (votes ?? []).filter((x) => x.votation_id === v.id);
            const t = tally(opts, vts, totalByBuilding.get(v.building_id) ?? 0, Number(v.quorum_pct), Number(v.approval_pct), v.kind);
            const mine = vts.find((x) => myUnitIds.has(x.unit_id));
            const myChoice = mine ? (mine.is_abstention ? ABSTAIN : mine.option_id) : null;

            return (
              <article key={v.id} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{v.title}</h2>
                    {v.description && <p className="mt-0.5 text-sm text-ink/80">{v.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${VOTATION_STATUS_STYLE[v.status]}`}>
                    {VOTATION_STATUS_LABEL[v.status]}
                  </span>
                </div>

                {v.status === "abierta" && (
                  <VotePanel votationId={v.id} options={opts.map((o) => ({ id: o.id, label: o.label }))} myChoice={myChoice} />
                )}

                <VotationResults tally={t} quorumPct={Number(v.quorum_pct)} approvalPct={Number(v.approval_pct)} closed={v.status === "cerrada"} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
