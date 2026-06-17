import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const ANNOUNCEMENT_KIND_LABEL: Record<Enums["announcement_kind"], string> = {
  anuncio: "Anuncio",
  novedad: "Novedad administrativa",
};

export const ANNOUNCEMENT_KIND_CLASS: Record<Enums["announcement_kind"], string> = {
  anuncio: "bg-sky-50 text-sky-700",
  novedad: "bg-violet-50 text-violet-700",
};

export const ANNOUNCEMENT_KIND_OPTIONS = Object.entries(
  ANNOUNCEMENT_KIND_LABEL,
) as [Enums["announcement_kind"], string][];
