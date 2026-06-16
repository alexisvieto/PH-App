import { Megaphone } from "lucide-react";

import { NewAnnouncementForm } from "@/components/forms/new-announcement-form";
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
      .select("id, title, body, published_at, building_id")
      .eq("organization_id", orgId)
      .order("published_at", { ascending: false })
      .limit(100),
  ]);

  const list = announcements ?? [];
  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));

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
                  <h2 className="font-medium">{a.title}</h2>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDate(a.published_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink/80">
                  {a.body}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Para: {building ?? "Todos los edificios"}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
