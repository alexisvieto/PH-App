import Link from "next/link";
import { ArrowRight, CheckCircle2, DoorOpen, Megaphone, Package, Siren, Vote } from "lucide-react";

import { ConstructionWorkerIcon, MarketBasketIcon } from "@/components/portal/featured-icons";

import { MarkAnnouncementsRead } from "@/components/mark-announcements-read";
import { AdBanner, type PortalAd } from "@/components/portal/ad-banner";
import { AttentionCard } from "@/components/portal/hub";
import { BALANCE_TOLERANCE } from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { getUnitStatement } from "@/lib/statement";
import { createClient } from "@/lib/supabase/server";

export default async function PortalHome() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const unitIds = res.units.map((u) => u.id);

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

  // ¿Hay una votación abierta? (tarjeta de atención)
  const { count: openVotes } = await supabase
    .from("votations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", res.orgId)
    .eq("status", "abierta");
  const hasVotacion = (openVotes ?? 0) > 0;

  // Pendientes en garita (urgentes): visita esperando + paquete por retirar.
  let pendingIntercom = 0;
  let pendingPackages = 0;
  if (accesosMod && unitIds.length > 0) {
    const [{ count: ic }, { count: pk }] = await Promise.all([
      supabase
        .from("intercom_requests")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", res.orgId)
        .in("unit_id", unitIds)
        .eq("status", "pendiente"),
      supabase
        .from("packages")
        .select("id", { count: "exact", head: true })
        .in("unit_id", unitIds)
        .eq("status", "en_garita"),
    ]);
    pendingIntercom = ic ?? 0;
    pendingPackages = pk ?? 0;
  }

  // Publicidad (red Nexera): campañas activas, en vigencia, globales o de esta org.
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

  // Saldo del hero: suma de las unidades del residente (RLS limita acceso).
  const statements = await Promise.all(res.units.map((u) => getUnitStatement(u.id)));
  const totalBalance = Math.round(statements.reduce((sum, s) => sum + (s?.balance ?? 0), 0) * 100) / 100;
  const owes = totalBalance > BALANCE_TOLERANCE;
  // Una unidad → directo al estado; varias → al hub de Cuenta.
  const accountHref = res.units.length === 1 ? `/portal/unidades/${res.units[0].id}` : "/portal/cuenta";

  return (
    <div className="space-y-6">
      {/* Hero: saludo + estado de cuenta a todo color (marca del tenant) */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${res.brand.primary} 0%, ${res.brand.accent} 100%)` }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-semibold">Hola{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="mt-0.5 text-sm text-white/80">{res.orgName ?? res.brand.name}</p>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {owes ? "Pago a realizar" : "Tu cuenta"}
              </p>
              {owes ? (
                <p className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(totalBalance)}</p>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-xl font-semibold">
                  <CheckCircle2 className="size-6" /> Estás al día
                </p>
              )}
            </div>
            <Link
              href={accountHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/90"
              style={{ color: res.brand.primary }}
            >
              {owes ? "Ver y pagar" : "Ver estado"} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarkAnnouncementsRead ids={news.map((a) => a.id)} />

      {/* Tarjetas de atención: SOLO aparecen cuando hay algo que hacer */}
      {(pendingIntercom > 0 || pendingPackages > 0 || hasVotacion) && (
        <div className="space-y-2">
          {pendingIntercom > 0 && (
            <AttentionCard href="/portal/citofono" icon={DoorOpen} tone="red" title="Visita en garita" sub="Toca para autorizar" />
          )}
          {pendingPackages > 0 && (
            <AttentionCard
              href="/portal/paquetes"
              icon={Package}
              tone="amber"
              title={`Paquete en garita${pendingPackages > 1 ? ` (${pendingPackages})` : ""}`}
              sub="Listo para retirar"
            />
          )}
          {hasVotacion && (
            <AttentionCard href="/portal/votaciones" icon={Vote} tone="brand" title="Votación abierta" sub="Tu voto cuenta — participa" />
          )}
        </div>
      )}

      {/* Proveedores para el hogar (la joya): acceso destacado */}
      <Link
        href="/portal/proveedores"
        className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 transition hover:bg-orange-100/60"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
          <ConstructionWorkerIcon className="size-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">Proveedores para tu hogar</span>
          <span className="block text-xs text-muted">Electricistas, electrodomésticos, remodelación y más · con reseñas</span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-orange-500" />
      </Link>

      {/* A domicilio: comercios a la mano del residente */}
      <Link
        href="/portal/a-domicilio"
        className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition hover:bg-emerald-100/60"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <MarketBasketIcon className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">A domicilio</span>
          <span className="block text-xs text-muted">Comida, súper, farmacia y más — directo a tu casa</span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-emerald-600" />
      </Link>

      {/* Botón de pánico (SOS) — siempre a la mano si el módulo está activo */}
      {accesosMod && (
        <Link
          href="/portal/sos"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 transition hover:bg-red-100"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <Siren className="size-5" />
          </span>
          <span>
            <span className="block font-semibold text-red-700">Emergencia · SOS</span>
            <span className="mt-0.5 block text-xs text-red-600/80">Alerta inmediata a la garita</span>
          </span>
        </Link>
      )}

      {/* Comunicados recientes — el corazón de la comunicación */}
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
              <article key={a.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-medium">{a.title}</h3>
                  <span className="shrink-0 text-xs text-muted">{formatDate(a.published_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{a.body}</p>
              </article>
            ))}
            <Link href="/portal/comunicados" className="inline-block text-sm font-medium text-brand hover:underline">
              Ver todos →
            </Link>
          </div>
        )}
      </section>

      {/* Publicidad (red Nexera) */}
      <AdBanner ads={ads} />
    </div>
  );
}
