import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

// Color por GRUPO (no arcoíris): cada hub tiene su familia. Tinte suave (no sólido)
// para una lista calmada; el rojo queda reservado para urgencias.
const TINT: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  indigo: "bg-indigo-100 text-indigo-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
  teal: "bg-teal-100 text-teal-700",
  cyan: "bg-cyan-100 text-cyan-700",
  orange: "bg-orange-100 text-orange-700",
  slate: "bg-slate-100 text-slate-700",
};

/** Fila-lista de un hub: ícono tintado + título + subtítulo + chevron. Escala sin "muro". */
export function HubRow({
  href,
  icon: Icon,
  color = "slate",
  label,
  sub,
}: {
  href: string;
  icon: LucideIcon;
  color?: keyof typeof TINT | string;
  label: string;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors duration-200 hover:border-brand/50"
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TINT[color] ?? TINT.slate}`}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-tight">{label}</span>
        {sub && <span className="mt-0.5 block text-xs text-muted">{sub}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </Link>
  );
}

const TONE: Record<string, { wrap: string; icon: string; title: string; sub: string }> = {
  red: { wrap: "border-red-200 bg-red-50 hover:bg-red-100", icon: "bg-red-600 text-white", title: "text-red-700", sub: "text-red-600/80" },
  amber: { wrap: "border-amber-200 bg-amber-50 hover:bg-amber-100", icon: "bg-amber-500 text-white", title: "text-amber-800", sub: "text-amber-700/80" },
  brand: { wrap: "border-brand/30 bg-brand-soft hover:opacity-90", icon: "bg-brand text-white", title: "text-brand", sub: "text-brand/70" },
};

/** Tarjeta de atención del tablero: solo se muestra cuando hay algo que hacer. */
export function AttentionCard({
  href,
  icon: Icon,
  tone = "brand",
  title,
  sub,
}: {
  href: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
  title: string;
  sub?: string;
}) {
  const t = TONE[tone] ?? TONE.brand;
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl border p-4 transition ${t.wrap}`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold leading-tight ${t.title}`}>{title}</span>
        {sub && <span className={`mt-0.5 block text-xs ${t.sub}`}>{sub}</span>}
      </span>
      <ChevronRight className={`size-5 shrink-0 ${t.title}`} />
    </Link>
  );
}

/** Encabezado de un hub (h1 de la página). */
export function HubHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** Encabezado de sección dentro de un hub (jerarquía h2). */
export function HubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
