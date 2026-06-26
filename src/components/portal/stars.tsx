import { Star } from "lucide-react";

/** Estrellas con relleno parcial (0–5), estilo Amazon. `starClass` fija el tamaño. */
export function Stars({ value, starClass = "size-4" }: { value: number; starClass?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-flex">
            <Star className={`${starClass} text-gray-300`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${starClass} fill-amber-400 text-amber-400`} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
