import Link from "next/link";
import { ChevronRight, FileText, Mail, Megaphone, Phone } from "lucide-react";

import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalHome() {
  const res = await getResidentContext();
  if (!res) return null;

  const supabase = await createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .limit(4);
  const news = announcements ?? [];

  const firstName = (res.fullName ?? "").split(" ")[0];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">
        Hola{firstName ? `, ${firstName}` : ""} 👋
      </h1>

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
