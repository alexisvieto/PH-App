import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Printer } from "lucide-react";

import { formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ComunicadoAcusePage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { announcementId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: ann } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .eq("id", announcementId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!ann) notFound();

  const [{ data: reads }, { data: people }] = await Promise.all([
    supabase
      .from("announcement_reads")
      .select("user_id, read_at")
      .eq("announcement_id", announcementId)
      .eq("organization_id", orgId)
      .order("read_at", { ascending: false }),
    supabase
      .from("people")
      .select("user_id, full_name")
      .eq("organization_id", orgId)
      .not("user_id", "is", null),
  ]);

  const nameByUser = new Map(
    (people ?? [])
      .filter((p) => p.user_id)
      .map((p) => [p.user_id as string, p.full_name]),
  );
  const list = reads ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/app/comunicados" className="text-sm text-muted hover:text-ink">
          ← Comunicados
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{ann.title}</h1>
        <p className="text-sm text-muted">{formatDate(ann.published_at)}</p>
      </div>

      <article className="rounded-2xl border border-line bg-surface p-4">
        <p className="whitespace-pre-line text-sm text-ink/80">{ann.body}</p>
      </article>

      <Link
        href={`/app/comunicados/${ann.id}/flyer`}
        target="_blank"
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-brand transition hover:bg-gray-50"
      >
        <Printer className="size-4" /> Imprimir para áreas sociales
      </Link>

      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <Eye className="size-4 text-brand" />
          <h2 className="font-semibold">Visto por {list.length} residente(s)</h2>
        </div>
        {list.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Todavía nadie lo ha visto.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((r) => (
              <li
                key={r.user_id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span>{nameByUser.get(r.user_id) ?? "Residente"}</span>
                <span className="text-muted">{formatDate(r.read_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
