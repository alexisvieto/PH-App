"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Marca como vistos (acuse) los comunicados que el residente está viendo.
 * Idempotente: conserva la primera fecha de lectura. RLS valida que sean
 * comunicados que le corresponden y que user_id = auth.uid().
 */
export async function markAnnouncementsRead(ids: string[]): Promise<void> {
  const unique = Array.from(new Set(ids)).slice(0, 50);
  if (unique.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS limita a comunicados visibles para el usuario; derivamos su org.
  const { data: anns } = await supabase
    .from("announcements")
    .select("id, organization_id")
    .in("id", unique);
  if (!anns || anns.length === 0) return;

  const rows = anns.map((a) => ({
    organization_id: a.organization_id,
    announcement_id: a.id,
    user_id: user.id,
  }));

  await supabase
    .from("announcement_reads")
    .upsert(rows, { onConflict: "announcement_id,user_id", ignoreDuplicates: true });
}
