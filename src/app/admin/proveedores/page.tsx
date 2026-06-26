import { Wrench } from "lucide-react";

import { NewProviderForm, ProviderToggle } from "@/components/admin/provider-forms";
import { Stars } from "@/components/portal/stars";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProveedoresPage() {
  const supabase = await createClient();
  const [{ data: cats }, { data: provs }] = await Promise.all([
    supabase.from("service_categories").select("id, name, sort_order").eq("active", true).order("sort_order"),
    supabase
      .from("service_providers")
      .select("id, name, priority, active, rating_avg, rating_count, service_provider_categories(category_id)")
      .order("priority", { ascending: false })
      .order("name"),
  ]);

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const list = provs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Wrench className="size-6 text-emerald-500" /> Proveedores
          </h1>
          <p className="text-sm text-muted">
            Directorio GLOBAL para el hogar · {list.length} proveedor(es) · lo ven todos los residentes.
          </p>
        </div>
        <NewProviderForm categories={cats ?? []} />
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay proveedores.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((p) => {
            const names = (p.service_provider_categories ?? []).map((x) => catName.get(x.category_id)).filter(Boolean);
            return (
              <article key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted">{names.join(" · ") || "Sin categoría"}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <Stars value={Number(p.rating_avg) || 0} starClass="size-3" />
                    <span>({p.rating_count})</span>
                    <span>· prioridad {p.priority}</span>
                  </div>
                </div>
                <ProviderToggle id={p.id} active={p.active} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
