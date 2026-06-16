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

function revalidateTicket(ticketId: string) {
  revalidatePath("/app/quejas");
  revalidatePath(`/app/quejas/${ticketId}`);
  revalidatePath("/portal/quejas");
  revalidatePath(`/portal/quejas/${ticketId}`);
}

/** Crea un ticket + su primer mensaje. RLS: residente solo para su unidad. */
export async function createTicket(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado.", ok: false };

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

  // org/building desde la unidad (RLS: el residente solo ve su unidad).
  const { data: unit } = await supabase
    .from("units")
    .select("organization_id, building_id")
    .eq("id", unitId)
    .maybeSingle();
  if (!unit) return { error: "Unidad no encontrada.", ok: false };

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      organization_id: unit.organization_id,
      building_id: unit.building_id,
      unit_id: unitId,
      category,
      subject,
      created_by: user.id,
    })
    .select("id")
    .maybeSingle();
  if (error || !ticket) {
    console.error("createTicket:", error);
    return { error: "No se pudo crear la solicitud.", ok: false };
  }

  const { error: msgErr } = await supabase.from("ticket_messages").insert({
    organization_id: unit.organization_id,
    ticket_id: ticket.id,
    body,
    author_id: user.id,
  });
  if (msgErr) {
    console.error("createTicket message:", msgErr);
    return { error: "Se creó la solicitud pero falló el mensaje.", ok: false };
  }

  revalidateTicket(ticket.id);
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
    .select("organization_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket) return { error: "Ticket no encontrado.", ok: false };

  const { error } = await supabase.from("ticket_messages").insert({
    organization_id: ticket.organization_id,
    ticket_id: ticketId,
    body,
    author_id: user.id,
  });
  if (error) {
    console.error("addTicketMessage:", error);
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

  const resolved = status === "resuelta" || status === "cerrada";
  const { error } = await supabase
    .from("tickets")
    .update({ status, resolved_at: resolved ? new Date().toISOString() : null })
    .eq("id", ticketId);
  if (error) {
    console.error("setTicketStatus:", error);
    return { error: "No se pudo actualizar el estado.", ok: false };
  }

  revalidateTicket(ticketId);
  return { error: null, ok: true };
}
