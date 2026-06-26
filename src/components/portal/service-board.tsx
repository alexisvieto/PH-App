"use client";

import { useState } from "react";
import Link from "next/link";

import { Stars } from "@/components/portal/stars";
import { tileColor } from "@/lib/providers";

export type ServiceItem = {
  id: string;
  name: string;
  logo_url: string | null;
  rating_avg: number;
  rating_count: number;
  categoryIds: string[];
};
export type ServiceCategory = { id: string; name: string };

export function ServiceBoard({ items, categories }: { items: ServiceItem[]; categories: ServiceCategory[] }) {
  const [cat, setCat] = useState("all");

  // Solo categorías con al menos un proveedor (no mostrar filtros vacíos).
  const present = categories.filter((c) => items.some((i) => i.categoryIds.includes(c.id)));
  const shown = cat === "all" ? items : items.filter((i) => i.categoryIds.includes(cat));

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          Todos
        </Chip>
        {present.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
        {shown.map((p) => (
          <Link key={p.id} href={`/portal/proveedores/${p.id}`} className="flex flex-col items-center gap-1.5">
            {p.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo_url} alt={p.name} className="size-[4.5rem] rounded-2xl object-cover shadow-sm ring-1 ring-line" />
            ) : (
              <span className={`flex size-[4.5rem] items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm ${tileColor(p.name)}`}>
                {p.name.trim()[0]?.toUpperCase() ?? "?"}
              </span>
            )}
            <span className="line-clamp-2 text-center text-xs font-medium leading-tight">{p.name}</span>
            {p.rating_count > 0 ? (
              <span className="flex items-center gap-1">
                <Stars value={p.rating_avg} starClass="size-3" />
                <span className="text-[10px] text-muted">({p.rating_count})</span>
              </span>
            ) : (
              <span className="text-[10px] text-muted">Nuevo</span>
            )}
          </Link>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          No hay proveedores en esta categoría por ahora.
        </p>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
