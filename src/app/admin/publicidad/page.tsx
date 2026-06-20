import { Globe, Megaphone, MousePointerClick } from "lucide-react";

import { CampaignRowActions } from "@/components/admin/campaign-row-actions";
import { NewCampaignForm } from "@/components/admin/new-campaign-form";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPublicidadPage() {
  const supabase = await createClient();

  const [{ data: orgs }, { data: campaigns }, { data: targets }] = await Promise.all([
    supabase.from("organizations").select("id, name").order("name"),
    supabase
      .from("ad_campaigns")
      .select("id, advertiser_name, title, image_path, link_url, is_global, status, starts_on, ends_on, clicks_count, priority")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("ad_campaign_targets").select("campaign_id, organization_id"),
  ]);

  const orgName = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const targetsByCampaign = new Map<string, string[]>();
  for (const t of targets ?? []) {
    const arr = targetsByCampaign.get(t.campaign_id) ?? [];
    arr.push(orgName.get(t.organization_id) ?? "—");
    targetsByCampaign.set(t.campaign_id, arr);
  }
  const publicUrl = (path: string | null) =>
    path ? supabase.storage.from("ph-ads").getPublicUrl(path).data.publicUrl : null;

  const list = campaigns ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Megaphone className="size-6 text-brand" /> Publicidad
          </h1>
          <p className="text-sm text-muted">
            Campañas de la red. Se muestran a los residentes en el portal según su segmentación.
          </p>
        </div>
        <NewCampaignForm orgs={orgs ?? []} />
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay campañas. Crea la primera con “Nueva campaña”.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((c) => {
            const url = publicUrl(c.image_path);
            const active = c.status === "active";
            return (
              <div key={c.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={c.title} className="h-20 w-full rounded-lg border border-line object-contain sm:w-36" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{c.title}</p>
                        <p className="text-sm text-muted">{c.advertiser_name}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {active ? "Activa" : "Pausada"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        {c.is_global ? (
                          <><Globe className="size-3.5" /> Toda la red</>
                        ) : (
                          <>{(targetsByCampaign.get(c.id) ?? []).join(", ") || "Sin segmentación"}</>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className="size-3.5" /> {c.clicks_count} clics
                      </span>
                      {(c.starts_on || c.ends_on) && (
                        <span>
                          {c.starts_on ? formatDate(c.starts_on) : "—"} → {c.ends_on ? formatDate(c.ends_on) : "—"}
                        </span>
                      )}
                      {c.link_url && <span className="truncate">{c.link_url}</span>}
                    </div>
                    <div className="mt-3">
                      <CampaignRowActions campaignId={c.id} status={c.status} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
