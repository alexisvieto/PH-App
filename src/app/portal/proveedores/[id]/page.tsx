import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone, type LucideIcon } from "lucide-react";

import { ReviewForm } from "@/components/portal/review-form";
import { Stars } from "@/components/portal/stars";
import { formatDate } from "@/lib/format";
import { tileColor } from "@/lib/providers";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { waPhone } from "@/lib/whatsapp";

export default async function ProveedorDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { data: p } = await supabase
    .from("service_providers")
    .select("id, name, logo_path, contact_name, phone, whatsapp, email, description, rating_avg, rating_count, service_provider_categories(category_id)")
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();

  const catIds = (p.service_provider_categories ?? []).map((x) => x.category_id);
  let cats: { id: string; name: string }[] = [];
  if (catIds.length) {
    const { data } = await supabase.from("service_categories").select("id, name").in("id", catIds);
    cats = data ?? [];
  }
  const { data: reviews } = await supabase
    .from("service_provider_reviews")
    .select("id, user_id, reviewer_name, rating, comment, created_at")
    .eq("provider_id", id)
    .order("created_at", { ascending: false });

  const logoUrl = p.logo_path ? supabase.storage.from("directorio").getPublicUrl(p.logo_path).data.publicUrl : null;
  const wa = waPhone(p.whatsapp);
  const ratingAvg = Number(p.rating_avg) || 0;
  const allReviews = reviews ?? [];
  const mine = allReviews.find((r) => r.user_id === res.userId) ?? null;
  const others = allReviews.filter((r) => r.user_id !== res.userId);

  return (
    <div className="space-y-6">
      <Link href="/portal/proveedores" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Proveedores
      </Link>

      <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={p.name} className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-line" />
        ) : (
          <span className={`flex size-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white ${tileColor(p.name)}`}>
            {p.name.trim()[0]?.toUpperCase() ?? "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold leading-tight">{p.name}</h1>
          {cats.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {cats.map((c) => (
                <span key={c.id} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                  {c.name}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Stars value={ratingAvg} starClass="size-4" />
            <span className="text-sm font-medium">{ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-muted">
              ({p.rating_count} {p.rating_count === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        </div>
      </div>

      {p.description && <p className="text-sm text-ink/80">{p.description}</p>}
      {p.contact_name && (
        <p className="text-sm text-muted">
          Contacto: <span className="font-medium text-ink">{p.contact_name}</span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {p.phone && <ContactBtn href={`tel:${p.phone}`} icon={Phone} label="Llamar" />}
        {wa && <ContactBtn href={`https://wa.me/${wa}`} icon={MessageCircle} label="WhatsApp" external tone="green" />}
        {p.email && <ContactBtn href={`mailto:${p.email}`} icon={Mail} label="Correo" />}
      </div>

      <ReviewForm
        providerId={p.id}
        defaultName={(res.fullName ?? "").trim()}
        existing={mine ? { rating: mine.rating, comment: mine.comment, reviewer_name: mine.reviewer_name } : null}
      />

      <section className="space-y-3">
        <h2 className="font-semibold">Reseñas ({allReviews.length})</h2>
        {others.length === 0 && !mine ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Sé el primero en dejar una reseña.
          </p>
        ) : (
          <div className="space-y-3">
            {others.map((r) => (
              <article key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.reviewer_name}</span>
                  <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                </div>
                <div className="mt-1">
                  <Stars value={r.rating} starClass="size-3.5" />
                </div>
                {r.comment && <p className="mt-1.5 text-sm text-ink/80">{r.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ContactBtn({
  href,
  icon: Icon,
  label,
  external = false,
  tone = "brand",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
  tone?: "brand" | "green";
}) {
  const cls =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "border-line bg-surface text-ink hover:border-brand/50";
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-medium transition ${cls}`}
    >
      <Icon className={`size-5 ${tone === "green" ? "text-emerald-600" : "text-brand"}`} />
      {label}
    </a>
  );
}
