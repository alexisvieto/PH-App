import Link from "next/link";
import { Vote } from "lucide-react";

import { PdfActions } from "@/components/portal/pdf-actions";
import { ABSTAIN, VotePanel } from "@/components/votaciones/vote-panel";
import { VotationResults } from "@/components/votaciones/votation-results";
import { VOTATION_STATUS_LABEL, VOTATION_STATUS_STYLE } from "@/lib/votations";
import { loadVotationResults, tallyFrom } from "@/lib/votations-server";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalVotacionesPage() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const myUnitCodes = new Set(res.units.map((u) => u.code));
  const supabase = await createClient();
  const { data: votations } = await supabase
    .from("votations")
    .select("id, title, description, kind, status, quorum_pct, approval_pct")
    .eq("organization_id", res.orgId)
    .in("status", ["abierta", "cerrada"])
    .order("created_at", { ascending: false })
    .limit(50);

  const list = votations ?? [];
  const results = await Promise.all(list.map((v) => loadVotationResults(v.id)));

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

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay votaciones por ahora.
        </p>
      ) : (
        <div className="space-y-4">
          {list.map((v, idx) => {
            const r = results[idx];
            const t = r ? tallyFrom(r, Number(v.quorum_pct), Number(v.approval_pct), v.kind) : null;
            const mine = r?.votes.find((x) => myUnitCodes.has(x.unit_code));
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
                  <VotePanel votationId={v.id} options={(r?.options ?? []).map((o) => ({ id: o.id, label: o.label }))} myChoice={myChoice} />
                )}

                {t && <VotationResults tally={t} quorumPct={Number(v.quorum_pct)} approvalPct={Number(v.approval_pct)} closed={v.status === "cerrada"} />}

                {v.status === "cerrada" && (
                  <PdfActions
                    url={`/portal/votaciones/${v.id}/acta`}
                    filename={`acta-votacion.pdf`}
                    title={`Acta · ${v.title}`}
                    name="acta"
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
