import { Users } from "lucide-react";

import { NewPersonForm } from "@/components/forms/new-person-form";
import { DOC_TYPE_LABEL } from "@/lib/padron";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PersonasPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: people } = await supabase
    .from("people")
    .select("id, full_name, doc_type, doc_number, email, phone")
    .eq("organization_id", orgId)
    .order("full_name", { ascending: true });

  const list = people ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-muted">
            Propietarios e inquilinos del padrón (solo visible para la administración).
          </p>
        </div>
        <NewPersonForm />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Users className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Aún no hay personas registradas</p>
          <p className="text-sm text-muted">
            Agrega propietarios o inquilinos con “Nueva persona”.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 text-muted">
                    {p.doc_type ? DOC_TYPE_LABEL[p.doc_type] : ""}{" "}
                    {p.doc_number ?? ""}
                    {!p.doc_type && !p.doc_number ? "—" : ""}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {p.email ?? ""}
                    {p.email && p.phone ? " · " : ""}
                    {p.phone ?? ""}
                    {!p.email && !p.phone ? "—" : ""}
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
