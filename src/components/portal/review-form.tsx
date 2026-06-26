"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";

import { submitReview } from "@/app/portal/proveedores/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input = "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function ReviewForm({
  providerId,
  defaultName,
  existing,
}: {
  providerId: string;
  defaultName: string;
  existing: { rating: number; comment: string | null; reviewer_name: string } | null;
}) {
  const [state, action] = useActionState(submitReview, EMPTY_ACTION_STATE);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <p className="font-semibold">{existing ? "Tu reseña" : "Deja tu reseña"}</p>
      <input type="hidden" name="provider_id" value={providerId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} de 5 estrellas`}
            className="p-0.5"
          >
            <Star className={`size-8 transition ${(hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Tu nombre</span>
        <input name="reviewer_name" required maxLength={80} defaultValue={existing?.reviewer_name ?? defaultName} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Comentario (opcional)</span>
        <textarea
          name="comment"
          rows={3}
          maxLength={2000}
          defaultValue={existing?.comment ?? ""}
          placeholder="¿Cómo fue el servicio?"
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">¡Gracias! Tu reseña se guardó.</p>}

      <SubmitButton pendingText="Guardando…">{existing ? "Actualizar reseña" : "Publicar reseña"}</SubmitButton>
    </form>
  );
}
