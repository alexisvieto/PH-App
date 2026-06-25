import Link from "next/link";
import { ArrowRight, HardHat, Trophy } from "lucide-react";

import { NewProjectForm } from "@/components/proyectos/new-project-form";
import { formatMoney } from "@/lib/format";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_STYLE } from "@/lib/projects";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProyectosPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  const isAdmin = canManage(ctx.role);

  const supabase = await createClient();
  const [{ data: projects }, { data: quotes }, { data: buildings }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, description, status, building_id, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("project_quotes").select("project_id, amount, is_winner").eq("organization_id", orgId),
    supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
  ]);

  const agg = new Map<string, { count: number; winner: number | null }>();
  for (const q of quotes ?? []) {
    const a = agg.get(q.project_id) ?? { count: 0, winner: null };
    a.count += 1;
    if (q.is_winner) a.winner = q.amount;
    agg.set(q.project_id, a);
  }
  const list = projects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <HardHat className="size-6 text-brand" /> Proyectos
          </h1>
          <p className="text-sm text-muted">
            Cotizaciones a la vista de los residentes y adjudicación con justificación. Gasto transparente.
          </p>
        </div>
        {isAdmin && <NewProjectForm buildings={buildings ?? []} />}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay proyectos. {isAdmin ? "Crea el primero (p. ej. “Pintura de PH”)." : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const a = agg.get(p.id) ?? { count: 0, winner: null };
            return (
              <Link
                key={p.id}
                href={`/app/proyectos/${p.id}`}
                className="block rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{p.title}</h2>
                    {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{p.description}</p>}
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${PROJECT_STATUS_STYLE[p.status]}`}>
                        {PROJECT_STATUS_LABEL[p.status]}
                      </span>
                      <span>
                        {a.count} cotizaci{a.count === 1 ? "ón" : "ones"}
                      </span>
                      {a.winner != null && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <Trophy className="size-3.5" /> {formatMoney(a.winner)}
                        </span>
                      )}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
