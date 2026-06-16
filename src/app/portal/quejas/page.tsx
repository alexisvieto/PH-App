import Link from "next/link";
import { ChevronRight, MessagesSquare } from "lucide-react";

import { NewTicketForm } from "@/components/forms/new-ticket-form";
import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_CLASS,
  TICKET_STATUS_LABEL,
} from "@/lib/tickets";

export default async function PortalQuejas() {
  const res = await getResidentContext();
  if (!res || res.units.length === 0) return null;

  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, subject, category, status, created_at")
    .in(
      "unit_id",
      res.units.map((u) => u.id),
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const list = tickets ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/portal" className="text-sm text-muted hover:text-ink">
            ← Inicio
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Quejas y solicitudes</h1>
        </div>
      </div>

      <NewTicketForm units={res.units} />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <MessagesSquare className="mx-auto mb-3 size-8 text-muted" />
          <p className="text-sm text-muted">
            Aún no has abierto ninguna. Usa “Nueva solicitud” para escribirle a la administración.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <Link
              key={t.id}
              href={`/portal/quejas/${t.id}`}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
            >
              <div>
                <p className="font-medium">{t.subject}</p>
                <p className="text-sm text-muted">
                  {TICKET_CATEGORY_LABEL[t.category]} · {formatDate(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_CLASS[t.status]}`}>
                  {TICKET_STATUS_LABEL[t.status]}
                </span>
                <ChevronRight className="size-5 text-muted" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
