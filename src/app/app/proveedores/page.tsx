import { Truck } from "lucide-react";

import { NewSupplierForm } from "@/components/forms/new-supplier-form";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProveedoresPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, contact_name, email, phone")
    .eq("organization_id", orgId)
    .order("name", { ascending: true })
    .limit(200);
  const list = suppliers ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-muted">
            Catálogo para mantenimientos, gastos y notificación de anomalías.
          </p>
        </div>
        <NewSupplierForm />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Truck className="mx-auto mb-3 size-8 text-muted" />
          <p className="font-medium">Aún no hay proveedores</p>
          <p className="text-sm text-muted">Agrega el primero con “Nuevo proveedor”.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Correo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted">{s.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{s.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
