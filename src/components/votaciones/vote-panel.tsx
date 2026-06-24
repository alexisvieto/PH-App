"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { castVote } from "@/app/portal/votaciones/actions";

const ABSTAIN = "__abstain__";

export function VotePanel({
  votationId,
  options,
  myChoice,
}: {
  votationId: string;
  options: { id: string; label: string }[];
  myChoice: string | null; // option id, ABSTAIN, o null
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(myChoice ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !selected) return;
    setBusy(true);
    const res = await castVote(votationId, selected === ABSTAIN ? null : selected, selected === ABSTAIN);
    setBusy(false);
    if (res.ok) {
      toast.success("Voto registrado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo votar.");
    }
  }

  return (
    <div className="space-y-2">
      {myChoice && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> Ya votaste — puedes cambiarlo hasta el cierre.
        </p>
      )}
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
              selected === o.id ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50"
            }`}
          >
            <input type="radio" name={`v-${votationId}`} checked={selected === o.id} onChange={() => setSelected(o.id)} className="size-4" />
            {o.label}
          </label>
        ))}
        <label
          className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-muted transition ${
            selected === ABSTAIN ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50"
          }`}
        >
          <input type="radio" name={`v-${votationId}`} checked={selected === ABSTAIN} onChange={() => setSelected(ABSTAIN)} className="size-4" />
          Abstención
        </label>
      </div>
      <button
        onClick={submit}
        disabled={busy || !selected}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} {myChoice ? "Cambiar voto" : "Votar"}
      </button>
    </div>
  );
}

export { ABSTAIN };
