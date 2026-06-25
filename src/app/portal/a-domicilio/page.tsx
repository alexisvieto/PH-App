import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { ProviderBoard, type ProviderItem } from "@/components/portal/provider-board";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { waPhone } from "@/lib/whatsapp";

export default async function ADomicilioPage() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("id, name, category, logo_path, link_url, whatsapp, phone, description")
    .eq("active", true)
    .order("priority", { ascending: false })
    .order("name");

  const items: ProviderItem[] = (data ?? []).map((p) => {
    const wa = waPhone(p.whatsapp);
    const href = p.link_url
      ? p.link_url
      : wa
        ? `https://wa.me/${wa}`
        : p.phone
          ? `tel:${p.phone}`
          : "#";
    const logo_url = p.logo_path
      ? supabase.storage.from("provider-logos").getPublicUrl(p.logo_path).data.publicUrl
      : null;
    return { id: p.id, name: p.name, category: p.category, description: p.description, href, logo_url };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-muted hover:text-ink">
          ← Inicio
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
          <ShoppingBag className="size-6 text-brand" /> A domicilio
        </h1>
        <p className="text-sm text-muted">
          Pide comida, súper, farmacia y más — directo a tu casa.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay comercios disponibles.
        </p>
      ) : (
        <ProviderBoard items={items} />
      )}
    </div>
  );
}
