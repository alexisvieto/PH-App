"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { TICKET_STATUS_OPTIONS } from "@/lib/tickets";
import { setTicketStatus } from "@/lib/tickets-server";
import type { Database } from "@/lib/supabase/database.types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

export function TicketStatusControl({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketStatus;
}) {
  const [state, action] = useActionState(setTicketStatus, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (state.ok) toast.success("Estado actualizado.");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <select
        name="status"
        defaultValue={current}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {TICKET_STATUS_OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <SubmitButton pendingText="…">Actualizar</SubmitButton>
    </form>
  );
}
