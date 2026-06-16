"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { addTicketMessage } from "@/lib/tickets-server";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState(addTicketMessage, EMPTY_ACTION_STATE);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Respuesta enviada.");
      ref.current?.reset();
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea
        name="body"
        required
        rows={3}
        maxLength={5000}
        placeholder="Escribe una respuesta…"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Enviando…">Responder</SubmitButton>
    </form>
  );
}
