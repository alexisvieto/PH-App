import Link from "next/link";
import { Wrench } from "lucide-react";

import { ServiceBoard, type ServiceCategory, type ServiceItem } from "@/components/portal/service-board";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProveedoresPage() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const [{ data: cats }, { data: provs }] = await Promise.all([
    supabase.from("service_categories").select("id, name, sort_order").eq("active", true).order("sort_order"),
    supabase
      .from("service_providers")
      .select("id, name, logo_path, rating_avg, rating_count, service_provider_categories(category_id)")
      .eq("active", true)
      .order("priority", { ascending: false })
      .order("rating_avg", { ascending: false }),
  ]);

  const categories: ServiceCategory[] = (cats ?? []).map((c) => ({ id: c.id, name: c.name }));
  const items: ServiceItem[] = (provs ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    logo_url: p.logo_path ? supabase.storage.from("directorio").getPublicUrl(p.logo_path).data.publicUrl : null,
    rating_avg: Number(p.rating_avg) || 0,
    rating_count: p.rating_count ?? 0,
    categoryIds: (p.service_provider_categories ?? []).map((x) => x.category_id),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <Wrench className="size-6 text-brand" /> Proveedores
        </h1>
        <p className="text-sm text-muted">Técnicos y empresas para tu hogar, con reseñas de otros residentes.</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay proveedores disponibles.
        </p>
      ) : (
        <ServiceBoard items={items} categories={categories} />
      )}
    </div>
  );
}
