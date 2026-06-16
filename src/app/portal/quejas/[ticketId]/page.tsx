import Link from "next/link";
import { notFound } from "next/navigation";

import { TicketReplyForm } from "@/components/forms/ticket-reply-form";
import { TicketThread, type ThreadMessage } from "@/components/ticket-thread";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_CLASS,
  TICKET_STATUS_LABEL,
} from "@/lib/tickets";

export default async function PortalQuejaDetalle({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const res = await getResidentContext();
  if (!res) return null;

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, subject, category, status")
    .eq("id", ticketId)
    .in(
      "unit_id",
      res.units.map((u) => u.id),
    )
    .maybeSingle();
  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, body, created_at, author_id")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  // En el portal, el residente solo ve sus tickets: lo que no es suyo es de la administración.
  const thread: ThreadMessage[] = (messages ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    fromStaff: m.author_id !== res.userId,
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/portal/quejas" className="text-sm text-muted hover:text-ink">
          ← Mis solicitudes
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_CLASS[ticket.status]}`}>
            {TICKET_STATUS_LABEL[ticket.status]}
          </span>
        </div>
        <p className="text-sm text-muted">{TICKET_CATEGORY_LABEL[ticket.category]}</p>
      </div>

      <TicketThread messages={thread} />

      {ticket.status === "cerrada" ? (
        <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
          Esta solicitud está cerrada. Si necesitas algo más, abre una nueva.
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-2 text-sm font-medium">Responder</p>
          <TicketReplyForm ticketId={ticket.id} />
        </div>
      )}
    </div>
  );
}
