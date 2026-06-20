"use client";

import { createClient } from "@/lib/supabase/client";

export type PortalAd = {
  id: string;
  advertiserName: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
};

export function AdBanner({ ads }: { ads: PortalAd[] }) {
  if (ads.length === 0) return null;

  async function onClick(ad: PortalAd) {
    // Cuenta el clic (no bloquea la navegación) y abre el enlace.
    void createClient().rpc("register_ad_click", { p_campaign: ad.id });
    if (ad.linkUrl) window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Patrocinado</p>
      <div className="space-y-3">
        {ads.map((ad) => {
          const Inner = (
            <>
              {ad.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-32 w-full rounded-xl border border-line object-cover"
                />
              )}
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <p className="font-medium">{ad.title}</p>
                <span className="shrink-0 text-xs text-muted">{ad.advertiserName}</span>
              </div>
            </>
          );
          return ad.linkUrl ? (
            <button
              key={ad.id}
              onClick={() => onClick(ad)}
              className="block w-full rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-brand/50"
            >
              {Inner}
            </button>
          ) : (
            <div key={ad.id} className="rounded-2xl border border-line bg-surface p-3">
              {Inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
