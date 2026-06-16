"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type TicketCategory = Database["public"]["Enums"]["ticket_category"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateTicket(ticketId?: string) {
  revalidatePath("/app/quejas");
  revalidatePath("/portal/quejas");
  if (ticketId) {
    revalidatePath(`/app/quejas/${ticketId}`);
    revalidatePath(`/portal/quejas/${ticketId}`);
  }
}

/** Crea un ticket + su primer mensaje de forma ATÓMICA (RPC). RLS dentro del RPC. */
export async function createTicket(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const unitId = String(formData.get("unit_id") ?? "");
  if (!UUID.test(unitId)) return { error: "Unidad inválida.", ok: false };
  const category = String(formData.get("category") ?? "queja") as TicketCategory;
  if (!(Constants.public.Enums.ticket_category as readonly string[]).includes(category))
    return { error: "Categoría inválida.", ok: false };
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject) return { error: "El asunto es obligatorio.", ok: false };
  if (!body) return { error: "Describe tu solicitud.", ok: false };
  if (subject.length > 200) return { error: "El asunto es muy largo.", ok: false };
  if (body.length > 5000) return { error: "El mensaje es muy largo.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_ticket", {
    p_unit_id: unitId,
    p_category: category,
    p_subject: subject,
    p_body: body,
  });
  if (error) {
    console.error("createTicket:", error.code, error.message);
    return { error: "No se pudo crear la solicitud.", ok: false };
  }

  revalidateTicket();
  return { error: null, ok: true };
}

/** Agrega un mensaje al hilo. RLS: staff de la org o residente dueño del ticket. */
export async function addTicketMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado.", ok: false };

  const ticketId = String(formData.get("ticket_id") ?? "");
  if (!UUID.test(ticketId)) return { error: "Ticket inválido.", ok: false };
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Escribe un mensaje.", ok: false };
  if (body.length > 5000) return { error: "El mensaje es muy largo.", ok: false };

  const { data: ticket } = await supabase
    .from("tickets")
    .select("organization_id, status")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Ticket no encontrado.", ok: false };
  if (ticket.status === "cerrada")
    return { error: "Este ticket está cerrado.", ok: false };

  const { error } = await supabase.from("ticket_messages").insert({
    organization_id: ticket.organization_id,
    ticket_id: ticketId,
    body,
    author_id: user.id,
  });
  if (error) {
    console.error("addTicketMessage:", error.code, error.message);
    return { error: "No se pudo enviar el mensaje.", ok: false };
  }

  revalidateTicket(ticketId);
  return { error: null, ok: true };
}

/** Cambia el estado del ticket. RLS: solo staff (tickets_update = is_org_member). */
export async function setTicketStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado.", ok: false };

  const ticketId = String(formData.get("ticket_id") ?? "");
  if (!UUID.test(ticketId)) return { error: "Ticket inválido.", ok: false };
  const status = String(formData.get("status") ?? "") as TicketStatus;
  if (!(Constants.public.Enums.ticket_status as readonly string[]).includes(status))
    return { error: "Estado inválido.", ok: false };

  // Preserva la fecha de resolución original (no se pisa al recerrar; se
  // limpia solo al reabrir).
  const { data: current } = await supabase
    .from("tickets")
    .select("resolved_at")
    .eq("id", ticketId)
    .maybeSingle();
  const resolved = status === "resuelta" || status === "cerrada";
  const resolvedAt = resolved
    ? (current?.resolved_at ?? new Date().toISOString())
    : null;

  const { error } = await supabase
    .from("tickets")
    .update({ status, resolved_at: resolvedAt })
    .eq("id", ticketId);
  if (error) {
    console.error("setTicketStatus:", error.code, error.message);
    return { error: "No se pudo actualizar el estado.", ok: false };
  }

  revalidateTicket(ticketId);
  return { error: null, ok: true };
}
