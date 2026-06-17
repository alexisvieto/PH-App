import Link from "next/link";
import { Eye, Megaphone } from "lucide-react";

import { NewAnnouncementForm } from "@/components/forms/new-announcement-form";
import { ANNOUNCEMENT_KIND_CLASS, ANNOUNCEMENT_KIND_LABEL } from "@/lib/announcements";
import { formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ComunicadosPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const [{ data: buildings }, { data: announcements }] = await Promise.all([
    supabase
      .from("buildings")
      .select("id, name")
      .eq("organization_id", orgId)
      .order("name", { ascending: true }),
    supabase
      .from("announcements")
      .select("id, title, body, published_at, building_id, kind")
      .eq("organization_id", orgId)
      .order("published_at", { ascending: false })
      .limit(100),
  ]);

  const list = announcements ?? [];

  // Acuses solo de los comunicados visibles (no toda la tabla histórica).
  const ids = list.map((a) => a.id);
  const { data: reads } = ids.length
    ? await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("organization_id", orgId)
        .in("announcement_id", ids)
    : { data: [] };
  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const readCount = new Map<string, number>();
  for (const r of reads ?? [])
    readCount.set(r.announcement_id, (readCount.get(r.announcement_id) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comunicados</h1>
          <p className="text-sm text-muted">
            Lo que publiques aquí lo ven los residentes en su portal.
          </p>
        </div>
        <NewAnnouncementForm buildings={buildings ?? []} />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Megaphone className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Aún no hay comunicados</p>
          <p className="text-sm text-muted">
            Publica el primero con “Nuevo comunicado”.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const building = a.building_id
              ? buildingName.get(a.building_id)
              : null;
            return (
              <article
                key={a.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ANNOUNCEMENT_KIND_CLASS[a.kind]}`}
                    >
                      {ANNOUNCEMENT_KIND_LABEL[a.kind]}
                    </span>
                    <h2 className="font-medium">{a.title}</h2>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDate(a.published_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink/80">
                  {a.body}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    Para: {building ?? "Todos los edificios"}
                  </p>
                  <Link
                    href={`/app/comunicados/${a.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                  >
                    <Eye className="size-3.5" /> Visto por {readCount.get(a.id) ?? 0}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
