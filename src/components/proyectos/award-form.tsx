"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { awardQuote } from "@/app/app/proyectos/actions";
import { formatMoney } from "@/lib/format";

type Quote = { id: string; companyName: string; amount: number };

const input =
  "w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function AwardForm({ projectId, quotes }: { projectId: string; quotes: Quote[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!selected) return toast.error("Selecciona la cotización ganadora.");
    if (!reason.trim()) return toast.error("Explica por qué se selecciona a esta empresa.");
    setBusy(true);
    const res = await awardQuote(projectId, selected, reason);
    setBusy(false);
    if (res.ok) {
      toast.success("Cotización adjudicada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Trophy className="size-4 text-emerald-600" /> Adjudicar ganadora
      </h3>
      <div className="space-y-2">
        {quotes.map((q) => (
          <label
            key={q.id}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-sm transition ${
              selected === q.id ? "border-emerald-500 ring-1 ring-emerald-500" : "border-line"
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="winner"
                value={q.id}
                checked={selected === q.id}
                onChange={() => setSelected(q.id)}
                className="size-4 accent-emerald-600"
              />
              <span className="font-medium">{q.companyName}</span>
            </span>
            <span className="font-semibold tabular-nums">{formatMoney(q.amount)}</span>
          </label>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">¿Por qué se selecciona a esta empresa? (visible a los residentes)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${input} min-h-24`}
          placeholder="Ej. Mejor relación precio-calidad, incluye garantía de 2 años y mejores referencias."
          required
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Trophy className="size-5" />} Adjudicar y publicar
      </button>
    </form>
  );
}
