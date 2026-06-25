import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Receipt, Trophy } from "lucide-react";

import { AddQuoteForm } from "@/components/proyectos/add-quote-form";
import { DeleteProjectButton, DeleteQuoteButton } from "@/components/proyectos/admin-buttons";
import { AwardForm } from "@/components/proyectos/award-form";
import { QuoteCard } from "@/components/proyectos/quote-card";
import { formatMoney } from "@/lib/format";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_STYLE } from "@/lib/projects";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 60 * 60; // 1 hora

export default async function ProyectoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  const isAdmin = canManage(ctx.role);

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description, status, building_id, award_reason")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: quotes }, { data: buildings }] = await Promise.all([
    supabase
      .from("project_quotes")
      .select("id, company_name, amount, notes, file_path, is_winner")
      .eq("project_id", id)
      .order("is_winner", { ascending: false })
      .order("amount", { ascending: true }),
    supabase.from("buildings").select("id, name").eq("organization_id", orgId),
  ]);

  const rows = quotes ?? [];
  const buildingName = project.building_id
    ? (buildings ?? []).find((b) => b.id === project.building_id)?.name ?? null
    : null;

  // URLs firmadas para los archivos (bucket privado, una sola llamada).
  const paths = rows.map((q) => q.file_path).filter((p): p is string => !!p);
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("ph-proyectos").createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
  }

  const winner = rows.find((q) => q.is_winner) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/app/proyectos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Proyectos
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_STYLE[project.status]}`}>
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
              {buildingName && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" /> {buildingName}
                </span>
              )}
            </p>
          </div>
          {isAdmin && <DeleteProjectButton projectId={project.id} />}
        </div>
        {project.description && <p className="mt-3 whitespace-pre-line text-sm text-ink/80">{project.description}</p>}
      </div>

      {/* Ganadora + justificación (transparencia) */}
      {winner && (
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Trophy className="size-4" /> Empresa seleccionada
          </p>
          <p className="mt-1 text-lg font-bold">
            {winner.company_name} · {formatMoney(winner.amount)}
          </p>
          {project.award_reason && (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Por qué se seleccionó</p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-ink/80">{project.award_reason}</p>
            </div>
          )}
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Receipt className="size-3.5" /> Registrado como gasto del PH en Finanzas
          </p>
        </section>
      )}

      {/* Cotizaciones */}
      <section className="space-y-3">
        <h2 className="font-semibold">Cotizaciones ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Aún no hay cotizaciones.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((q) => (
              <QuoteCard
                key={q.id}
                quote={{
                  id: q.id,
                  companyName: q.company_name,
                  amount: q.amount,
                  notes: q.notes,
                  isWinner: q.is_winner,
                }}
                fileUrl={q.file_path ? signedByPath.get(q.file_path) ?? null : null}
                action={isAdmin ? <DeleteQuoteButton quoteId={q.id} /> : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Controles de administración */}
      {isAdmin && (
        <div className="space-y-4">
          <AddQuoteForm orgId={orgId} projectId={project.id} />
          {project.status === "abierto" && rows.length > 0 && (
            <AwardForm
              projectId={project.id}
              quotes={rows.map((q) => ({ id: q.id, companyName: q.company_name, amount: q.amount }))}
            />
          )}
        </div>
      )}
    </div>
  );
}
