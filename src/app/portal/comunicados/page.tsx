import Link from "next/link";
import { Megaphone } from "lucide-react";

import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalComunicados() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .eq("organization_id", res.orgId)
    .order("published_at", { ascending: false })
    .limit(100);
  const news = announcements ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Megaphone className="size-5 text-brand" />
          <h1 className="text-2xl font-semibold">Comunicados</h1>
        </div>
      </div>

      {news.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay comunicados por ahora.
        </p>
      ) : (
        <div className="space-y-3">
          {news.map((a) => (
            <article key={a.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">{a.title}</h2>
                <span className="shrink-0 text-xs text-muted">
                  {formatDate(a.published_at)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{a.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
