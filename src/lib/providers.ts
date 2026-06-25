/** Categorías del directorio "A domicilio" (orden de presentación). */
export const PROVIDER_CATEGORIES: { key: string; label: string }[] = [
  { key: "restaurantes", label: "Restaurantes" },
  { key: "supermercados", label: "Supermercados" },
  { key: "farmacias", label: "Farmacias" },
  { key: "mensajeria", label: "Mensajería" },
  { key: "servicios", label: "Servicios" },
  { key: "otros", label: "Otros" },
];

export function categoryLabel(key: string): string {
  return PROVIDER_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** Color de tile (placeholder cuando el comercio no tiene logo). Determinista por nombre. */
const TILE_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-red-500",
];

export function tileColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TILE_PALETTE[h % TILE_PALETTE.length];
}
