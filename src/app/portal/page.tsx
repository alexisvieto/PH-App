import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  type LucideIcon,
  Mail,
  Megaphone,
  MessagesSquare,
  Phone,
  PhoneCall,
  QrCode,
  Siren,
  Vote,
} from "lucide-react";

import { MarkAnnouncementsRead } from "@/components/mark-announcements-read";
import { AdBanner, type PortalAd } from "@/components/portal/ad-banner";
import { BALANCE_TOLERANCE } from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { getUnitStatement } from "@/lib/statement";
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

  // ¿Hay áreas comunes activas para reservar? (define si mostramos el acceso)
  const { count: areasCount } = await supabase
    .from("common_areas")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", res.orgId)
    .eq("active", true);
  const hasReservas = (areasCount ?? 0) > 0;

  // ¿Hay una votación abierta? (para mostrar el acceso en el inicio)
  const { count: openVotes } = await supabase
    .from("votations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", res.orgId)
    .eq("status", "abierta");
  const hasVotacion = (openVotes ?? 0) > 0;

  // ¿Hay una visita esperando en garita (citófono)? — urgente.
  const unitIds = res.units.map((u) => u.id);
  let pendingIntercom = 0;
  if (accesosMod && unitIds.length > 0) {
    const { count } = await supabase
      .from("intercom_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", res.orgId)
      .in("unit_id", unitIds)
      .eq("status", "pendiente");
    pendingIntercom = count ?? 0;
  }

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

  // Saldo para el hero: suma de las unidades del residente (RLS limita acceso).
  const statements = await Promise.all(res.units.map((u) => getUnitStatement(u.id)));
  const totalBalance = Math.round(
    statements.reduce((sum, s) => sum + (s?.balance ?? 0), 0) * 100,
  ) / 100;
  const owes = totalBalance > BALANCE_TOLERANCE;
  // El botón del hero lleva al estado de cuenta solo si hay una unidad; con
  // varias, los tiles de abajo dan acceso unidad por unidad.
  const statementHref =
    res.units.length === 1 ? `/portal/unidades/${res.units[0].id}` : null;

  return (
    <div className="space-y-7">
      {/* Hero: saludo + estado de cuenta a todo color (marca del tenant) */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${res.brand.primary} 0%, ${res.brand.accent} 100%)`,
        }}
      >
        {/* destello decorativo */}
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-semibold">
            Hola{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-0.5 text-sm text-white/80">
            {res.orgName ?? res.brand.name}
          </p>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {owes ? "Saldo pendiente" : "Tu cuenta"}
              </p>
              {owes ? (
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {formatMoney(totalBalance)}
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-xl font-semibold">
                  <CheckCircle2 className="size-6" /> Estás al día
                </p>
              )}
            </div>
            {statementHref && (
              <Link
                href={statementHref}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/90"
                style={{ color: res.brand.primary }}
              >
                Ver estado <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <MarkAnnouncementsRead ids={news.map((a) => a.id)} />

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
            <span className="mt-0.5 block text-xs text-red-600/80">
              Alerta inmediata a la garita
            </span>
          </span>
        </Link>
      )}

      {/* Accesos rápidos: tarjetas con ícono (mobile-first, táctil) */}
      <div className="grid grid-cols-2 gap-3">
        {pendingIntercom > 0 && (
          <ActionTile
            href="/portal/citofono"
            icon={PhoneCall}
            color="red"
            label="Visita en garita"
            sub="Toca para autorizar"
          />
        )}
        {res.units.map((u) => (
          <ActionTile
            key={u.id}
            href={`/portal/unidades/${u.id}`}
            icon={FileText}
            color="emerald"
            label="Estado de cuenta"
            sub={res.units.length > 1 ? `Unidad ${u.code}` : "Saldo y pagos"}
          />
        ))}
        {accesosMod && (
          <ActionTile
            href="/portal/accesos"
            icon={QrCode}
            color="indigo"
            label="Mis visitas"
            sub="Pases con QR"
          />
        )}
        {hasReservas && (
          <ActionTile
            href="/portal/reservas"
            icon={CalendarDays}
            color="violet"
            label="Reservas"
            sub="Áreas comunes"
          />
        )}
        {hasVotacion && (
          <ActionTile
            href="/portal/votaciones"
            icon={Vote}
            color="rose"
            label="Votaciones"
            sub="Hay una votación abierta"
          />
        )}
        <ActionTile
          href="/portal/quejas"
          icon={MessagesSquare}
          color="amber"
          label="Quejas"
          sub="Escríbele a la admin"
        />
        <ActionTile
          href="/portal/comunicados"
          icon={Megaphone}
          color="sky"
          label="Comunicados"
          sub="Avisos del edificio"
        />
      </div>

      {/* Comunicados recientes */}
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

// Paleta plana por función (estilo "flat design", íconos sólidos sin sombra).
const TILE_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  red: "bg-red-500",
};

function ActionTile({
  href,
  icon: Icon,
  color,
  label,
  sub,
}: {
  href: string;
  icon: LucideIcon;
  color: string;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-brand/50"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-xl text-white ${TILE_COLORS[color] ?? "bg-brand"}`}
      >
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-medium leading-tight">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{sub}</span>
      </span>
    </Link>
  );
}
