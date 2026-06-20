import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Mail,
  Megaphone,
  MessagesSquare,
  Phone,
  QrCode,
} from "lucide-react";

import { MarkAnnouncementsRead } from "@/components/mark-announcements-read";
import { AdBanner, type PortalAd } from "@/components/portal/ad-banner";
import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalHome() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .eq("organization_id", res.orgId)
    .order("published_at", { ascending: false })
    .limit(4);
  const news = announcements ?? [];

  // ¿La org tiene activo el módulo de accesos? (add-on pago)
  const { data: accesosMod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", res.orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();

  // Publicidad (red Nexera): campañas activas, en vigencia, globales o
  // dirigidas a esta organización.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const [{ data: adRows }, { data: adTargets }] = await Promise.all([
    supabase
      .from("ad_campaigns")
      .select("id, advertiser_name, title, image_path, link_url, is_global, starts_on, ends_on")
      .eq("status", "active")
      .order("priority", { ascending: false })
      .limit(20),
    supabase.from("ad_campaign_targets").select("campaign_id").eq("organization_id", res.orgId),
  ]);
  const targetedAds = new Set((adTargets ?? []).map((t) => t.campaign_id));
  const ads: PortalAd[] = (adRows ?? [])
    .filter(
      (a) =>
        (a.is_global || targetedAds.has(a.id)) &&
        (!a.starts_on || a.starts_on <= today) &&
        (!a.ends_on || a.ends_on >= today),
    )
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      advertiserName: a.advertiser_name,
      title: a.title,
      imageUrl: a.image_path
        ? supabase.storage.from("ph-ads").getPublicUrl(a.image_path).data.publicUrl
        : null,
      linkUrl: a.link_url,
    }));

  const firstName = (res.fullName ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">
        Hola{firstName ? `, ${firstName}` : ""} 👋
      </h1>

      <MarkAnnouncementsRead ids={news.map((a) => a.id)} />

      {/* Comunicados primero: el portal es comunicativo */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="size-5 text-brand" />
          <h2 className="font-semibold">Comunicados</h2>
        </div>
        {news.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            No hay comunicados por ahora.
          </p>
        ) : (
          <div className="space-y-3">
            {news.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-medium">{a.title}</h3>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDate(a.published_at)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink/80">
                  {a.body}
                </p>
              </article>
            ))}
            <Link
              href="/portal/comunicados"
              className="inline-block text-sm font-medium text-brand hover:underline"
            >
              Ver todos →
            </Link>
          </div>
        )}
      </section>

      {/* Publicidad (red Nexera) */}
      <AdBanner ads={ads} />

      {/* Estado de cuenta = un botón más (sin mostrar el saldo aquí) */}
      <section className="space-y-3">
        <h2 className="font-semibold">Mi estado de cuenta</h2>
        <div className="space-y-2">
          {res.units.map((u) => (
            <Link
              key={u.id}
              href={`/portal/unidades/${u.id}`}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Unidad {u.code}</p>
                  <p className="text-sm text-muted">{u.buildingName}</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      {/* Accesos (módulo pago activo) */}
      {accesosMod && (
        <section className="space-y-3">
          <h2 className="font-semibold">Mis visitas</h2>
          <Link
            href="/portal/accesos"
            className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <QrCode className="size-4" />
              </div>
              <div>
                <p className="font-medium">Pases de visita</p>
                <p className="text-sm text-muted">Crea un QR para tus visitas</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </Link>
        </section>
      )}

      {/* Canal con la administración */}
      <section className="space-y-3">
        <h2 className="font-semibold">Atención</h2>
        <Link
          href="/portal/quejas"
          className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <MessagesSquare className="size-4" />
            </div>
            <div>
              <p className="font-medium">Quejas y solicitudes</p>
              <p className="text-sm text-muted">Escríbele a la administración</p>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted" />
        </Link>
      </section>

      {/* Contacto con la administración */}
      {(res.contactEmail || res.contactPhone) && (
        <section className="rounded-2xl border border-line bg-surface p-4 text-sm">
          <p className="font-medium">¿Dudas? Escríbele a la administración</p>
          <div className="mt-2 flex flex-col gap-1 text-muted">
            {res.contactEmail && (
              <a
                href={`mailto:${res.contactEmail}`}
                className="flex items-center gap-2 hover:text-brand"
              >
                <Mail className="size-4" /> {res.contactEmail}
              </a>
            )}
            {res.contactPhone && (
              <a
                href={`tel:${res.contactPhone}`}
                className="flex items-center gap-2 hover:text-brand"
              >
                <Phone className="size-4" /> {res.contactPhone}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
