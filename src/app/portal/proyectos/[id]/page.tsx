import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt, Trophy } from "lucide-react";

import { QuoteCard } from "@/components/proyectos/quote-card";
import { formatMoney } from "@/lib/format";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_STYLE } from "@/lib/projects";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL = 60 * 60;

export default async function PortalProyectoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description, status, award_reason")
    .eq("id", id)
    .eq("organization_id", res.orgId)
    .maybeSingle();
  if (!project) notFound();

  const { data: quotes } = await supabase
    .from("project_quotes")
    .select("id, company_name, amount, notes, file_path, is_winner")
    .eq("project_id", id)
    .order("is_winner", { ascending: false })
    .order("amount", { ascending: true });
  const rows = quotes ?? [];

  const paths = rows.map((q) => q.file_path).filter((p): p is string => !!p);
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("ph-proyectos").createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
  }

  const winner = rows.find((q) => q.is_winner) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/proyectos" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Proyectos
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{project.title}</h1>
        <p className="mt-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_STYLE[project.status]}`}>
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
        </p>
        {project.description && <p className="mt-3 whitespace-pre-line text-sm text-ink/80">{project.description}</p>}
      </div>

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
            <Receipt className="size-3.5" /> Registrado como gasto del PH
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">Cotizaciones recibidas ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Aún no hay cotizaciones publicadas.
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
