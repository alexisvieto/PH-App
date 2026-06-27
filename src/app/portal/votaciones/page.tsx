import Link from "next/link";
import { Vote } from "lucide-react";

import { PdfViewShare } from "@/components/portal/pdf-view-share";
import { MonthSection } from "@/components/votaciones/month-section";
import { ABSTAIN, VotePanel } from "@/components/votaciones/vote-panel";
import { VotationResults } from "@/components/votaciones/votation-results";
import {
  DECISION_LABEL,
  DECISION_STYLE,
  VOTATION_PHASE_LABEL,
  VOTATION_PHASE_STYLE,
  groupByMonth,
  votationPhase,
} from "@/lib/votations";
import { loadVotationResults, tallyFrom } from "@/lib/votations-server";
import { blockTenant } from "@/lib/portal-guard";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalVotacionesPage() {
  await blockTenant();
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  // El residente ve las votaciones ya iniciadas (abiertas o cerradas), nunca las programadas.
  const { data: votations } = await supabase
    .from("votations")
    .select("id, title, description, kind, opens_at, closes_at, quorum_pct, approval_pct")
    .eq("organization_id", res.orgId)
    .lte("opens_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  const list = votations ?? [];
  const [results, votable] = await Promise.all([
    Promise.all(list.map((v) => loadVotationResults(v.id))),
    Promise.all(
      list.map((v) =>
        supabase
          .rpc("votable_units_for", { p_votation: v.id })
          .then((r) => (r.data ?? []) as { unit_id: string; unit_code: string; is_current: boolean }[]),
      ),
    ),
  ]);

  const items = list.map((v, idx) => {
    const r = results[idx];
    const phase = votationPhase(v.opens_at, v.closes_at);
    const t = r ? tallyFrom(r, Number(v.quorum_pct), Number(v.approval_pct), v.kind) : null;
    // Una boleta por unidad AL DÍA del residente (Ley 284). El moroso no recibe boleta.
    const ballots = votable[idx]
      .filter((u) => u.is_current)
      .map((u) => {
        const mine = r?.votes.find((x) => x.unit_code === u.unit_code);
        return { unitId: u.unit_id, unitCode: u.unit_code, myChoice: mine ? (mine.is_abstention ? ABSTAIN : mine.option_id) : null };
      });
    return { v, r, phase, t, ballots, owns: votable[idx].length > 0, multiUnit: ballots.length > 1 };
  });
  // Activas: solo si el residente tiene al menos una unidad que puede votar (oculta al moroso).
  const active = items.filter((x) => x.phase !== "cerrada" && x.ballots.length > 0);
  // Archivo: votaciones cerradas de los edificios donde el residente tiene unidad.
  const archive = groupByMonth(items.filter((x) => x.phase === "cerrada" && x.owns), (x) => x.v.closes_at);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <Vote className="size-6 text-brand" /> Votaciones
        </h1>
        <p className="text-sm text-muted">Cada unidad al día equivale a un voto (Ley 284).</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay votaciones por ahora.
        </p>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-4">
              {active.map(({ v, r, phase, t, ballots, multiUnit }) => (
                <article key={v.id} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{v.title}</h2>
                      {v.description && <p className="mt-0.5 text-sm text-ink/80">{v.description}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${VOTATION_PHASE_STYLE[phase]}`}>
                      {VOTATION_PHASE_LABEL[phase]}
                    </span>
                  </div>

                  {phase === "abierta" && (
                    <div className="space-y-3">
                      {ballots.map((b) => (
                        <VotePanel
                          key={b.unitId}
                          votationId={v.id}
                          unitId={b.unitId}
                          unitCode={b.unitCode}
                          options={(r?.options ?? []).map((o) => ({ id: o.id, label: o.label }))}
                          myChoice={b.myChoice}
                          showUnit={multiUnit}
                        />
                      ))}
                    </div>
                  )}

                  {t && <VotationResults tally={t} quorumPct={Number(v.quorum_pct)} approvalPct={Number(v.approval_pct)} closed={false} />}
                </article>
              ))}
            </div>
          )}

          {archive.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Archivo</h2>
              {archive.map((g, gi) => (
                <MonthSection key={g.key} label={g.label} count={g.items.length} defaultOpen={gi === 0}>
                  {g.items.map(({ v, t }) => (
                    <div key={v.id} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
                      <div>
                        <p className="font-medium">{v.title}</p>
                        {t && (
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DECISION_STYLE[t.decision]}`}>
                            {DECISION_LABEL[t.decision]}
                          </span>
                        )}
                      </div>
                      <PdfViewShare
                        url={`/portal/votaciones/${v.id}/acta`}
                        filename={`acta-${v.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)}.pdf`}
                        title={`Acta · ${v.title}`}
                      />
                    </div>
                  ))}
                </MonthSection>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
