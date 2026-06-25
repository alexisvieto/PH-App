"use client";

import { useState } from "react";

import { PROVIDER_CATEGORIES, tileColor } from "@/lib/providers";

export type ProviderItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  href: string;
  logo_url: string | null;
};

export function ProviderBoard({ items }: { items: ProviderItem[] }) {
  const [cat, setCat] = useState("all");

  // Solo las categorías que tienen comercios (para no mostrar filtros vacíos).
  const present = PROVIDER_CATEGORIES.filter((c) => items.some((i) => i.category === c.key));
  const shown = cat === "all" ? items : items.filter((i) => i.category === cat);

  return (
    <div className="space-y-4">
      {/* Filtro por categoría (chips deslizables) */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          Todos
        </Chip>
        {present.map((c) => (
          <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>
            {c.label}
          </Chip>
        ))}
      </div>

      {/* Grilla de "apps": ícono/logo + nombre (tap abre el comercio) */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
        {shown.map((p) => {
          const external = !p.href.startsWith("tel:");
          return (
            <a
              key={p.id}
              href={p.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="flex flex-col items-center gap-1.5"
            >
              {p.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.logo_url}
                  alt={p.name}
                  className="size-[4.5rem] rounded-2xl object-cover shadow-sm ring-1 ring-line"
                />
              ) : (
                <span
                  className={`flex size-[4.5rem] items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm ${tileColor(
                    p.name,
                  )}`}
                >
                  {p.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <span className="line-clamp-2 text-center text-xs font-medium leading-tight">{p.name}</span>
            </a>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay comercios en esta categoría por ahora.
        </p>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand text-white" : "bg-surface text-muted ring-1 ring-line hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
