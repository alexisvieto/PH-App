import {
  CalendarDays,
  Dumbbell,
  Flame,
  PartyPopper,
  Trees,
  Truck,
  Waves,
} from "lucide-react";

type IconCmp = React.ComponentType<{ className?: string }>;

/** Ascensor: lucide no trae uno, lo dibujamos al estilo lucide (stroke, 24x24). */
function Elevator({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M10 9l2-2 2 2" />
      <path d="M10 15l2 2 2-2" />
    </svg>
  );
}

/** Clave de ícono → componente. La clave se guarda en common_areas.icon. */
const ICONS: Record<string, IconCmp> = {
  party: PartyPopper,
  bbq: Flame,
  elevator: Elevator,
  truck: Truck,
  gym: Dumbbell,
  pool: Waves,
  garden: Trees,
  default: CalendarDays,
};

export function areaIcon(key: string | null | undefined): IconCmp {
  return ICONS[key ?? "default"] ?? CalendarDays;
}

/** Color representativo por recurso (fondo suave + ícono a color). */
const ICON_COLOR: Record<string, string> = {
  party: "bg-fuchsia-100 text-fuchsia-600",
  bbq: "bg-orange-100 text-orange-600",
  elevator: "bg-teal-100 text-teal-600",
  truck: "bg-blue-100 text-blue-600",
  gym: "bg-violet-100 text-violet-600",
  pool: "bg-sky-100 text-sky-600",
  garden: "bg-emerald-100 text-emerald-600",
  default: "bg-slate-100 text-slate-600",
};

export function areaIconColor(key: string | null | undefined): string {
  return ICON_COLOR[key ?? "default"] ?? ICON_COLOR.default;
}

/** Opciones para que el admin elija el ícono al crear/editar un área. */
export const AREA_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "party", label: "Salón / fiestas" },
  { key: "bbq", label: "BBQ / parrilla" },
  { key: "elevator", label: "Elevador" },
  { key: "truck", label: "Mudanza" },
  { key: "gym", label: "Gimnasio" },
  { key: "pool", label: "Piscina" },
  { key: "garden", label: "Jardín / terraza" },
  { key: "default", label: "Genérico" },
];
