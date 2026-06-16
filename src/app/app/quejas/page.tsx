import Link from "next/link";
import { ChevronRight, MessagesSquare } from "lucide-react";

import { formatDate } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_CLASS,
  TICKET_STATUS_LABEL,
} from "@/lib/tickets";

export default async function QuejasPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const [{ data: tickets }, { data: units }] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, subject, category, status, unit_id, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("units").select("id, code").eq("organization_id", orgId),
  ]);

  const unitCode = new Map((units ?? []).map((u) => [u.id, u.code]));
  const list = tickets ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quejas y solicitudes</h1>
        <p className="text-sm text-muted">
          Lo que abren los residentes desde su portal. Gestiona el estado y responde.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <MessagesSquare className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">No hay solicitudes</p>
          <p className="text-sm text-muted">
            Aparecerán aquí cuando un residente abra una desde su portal.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Asunto</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/app/quejas/${t.id}`} className="hover:text-brand hover:underline">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{unitCode.get(t.unit_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{TICKET_CATEGORY_LABEL[t.category]}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_CLASS[t.status]}`}>
                      {TICKET_STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(t.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/quejas/${t.id}`} className="inline-flex text-muted hover:text-brand">
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
