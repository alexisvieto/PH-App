import Link from "next/link";
import { Vote } from "lucide-react";

import { MonthSection } from "@/components/votaciones/month-section";
import { NewVotationForm } from "@/components/votaciones/new-votation-form";
import { VOTATION_PHASE_LABEL, VOTATION_PHASE_STYLE, groupByMonth, votationPhase } from "@/lib/votations";

type VotationRow = {
  id: string;
  title: string;
  kind: "si_no" | "multiple";
  opens_at: string | null;
  closes_at: string | null;
  building_id: string;
  created_at: string;
};

function VotationLink({ v, buildingName }: { v: VotationRow; buildingName: string }) {
  const phase = votationPhase(v.opens_at, v.closes_at);
  return (
    <Link
      href={`/app/votaciones/${v.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
    >
      <div className="min-w-0">
        <p className="font-medium">{v.title}</p>
        <p className="text-sm text-muted">
          {buildingName} · {v.kind === "si_no" ? "Sí / No" : "Opción múltiple"}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${VOTATION_PHASE_STYLE[phase]}`}>
        {VOTATION_PHASE_LABEL[phase]}
      </span>
    </Link>
  );
}
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function VotacionesPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const [{ data: votations }, { data: buildings }] = await Promise.all([
    supabase
      .from("votations")
      .select("id, title, kind, opens_at, closes_at, building_id, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
  ]);
  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, label: b.name }));

  const all = (votations ?? []) as VotationRow[];
  const active = all.filter((v) => votationPhase(v.opens_at, v.closes_at) !== "cerrada");
  const closed = all.filter((v) => votationPhase(v.opens_at, v.closes_at) === "cerrada");
  const archive = groupByMonth(closed, (v) => v.closes_at);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Vote className="size-6 text-brand" /> Votaciones
          </h1>
          <p className="text-sm text-muted">Asambleas digitales ponderadas por coeficiente.</p>
        </div>
        <NewVotationForm buildings={buildingOptions} />
      </div>

      {all.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay votaciones. Crea la primera.
        </p>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map((v) => (
                <VotationLink key={v.id} v={v} buildingName={buildingName.get(v.building_id) ?? ""} />
              ))}
            </div>
          )}

          {archive.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Archivo</h2>
              {archive.map((g, gi) => (
                <MonthSection key={g.key} label={g.label} count={g.items.length} defaultOpen={gi === 0}>
                  {g.items.map((v) => (
                    <VotationLink key={v.id} v={v} buildingName={buildingName.get(v.building_id) ?? ""} />
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
