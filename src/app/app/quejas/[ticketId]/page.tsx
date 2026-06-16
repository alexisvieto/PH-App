import Link from "next/link";
import { notFound } from "next/navigation";

import { TicketReplyForm } from "@/components/forms/ticket-reply-form";
import { TicketStatusControl } from "@/components/forms/ticket-status-control";
import { TicketThread, type ThreadMessage } from "@/components/ticket-thread";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_CLASS,
  TICKET_STATUS_LABEL,
} from "@/lib/tickets";

export default async function QuejaDetallePage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, subject, category, status, unit_id, created_at")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) notFound();

  const [{ data: messages }, { data: members }, { data: unit }] =
    await Promise.all([
      supabase
        .from("ticket_messages")
        .select("id, body, created_at, author_id")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId),
      supabase.from("units").select("code").eq("id", ticket.unit_id).maybeSingle(),
    ]);

  const staffIds = new Set((members ?? []).map((m) => m.user_id));
  const thread: ThreadMessage[] = (messages ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    fromStaff: !!m.author_id && staffIds.has(m.author_id),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/app/quejas" className="text-sm text-muted hover:text-ink">
          ← Quejas y solicitudes
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_CLASS[ticket.status]}`}>
            {TICKET_STATUS_LABEL[ticket.status]}
          </span>
        </div>
        <p className="text-sm text-muted">
          {TICKET_CATEGORY_LABEL[ticket.category]} · Unidad{" "}
          {(unit as { code: string } | null)?.code ?? "—"}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase text-muted">Cambiar estado</p>
        <TicketStatusControl ticketId={ticket.id} current={ticket.status} />
      </div>

      <TicketThread messages={thread} />

      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="mb-2 text-sm font-medium">Responder</p>
        <TicketReplyForm ticketId={ticket.id} />
      </div>
    </div>
  );
}
