"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { createProject } from "@/app/app/proyectos/actions";

const input =
  "w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function NewProjectForm({ buildings }: { buildings: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buildingId, setBuildingId] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!title.trim()) return toast.error("Escribe el título del proyecto.");
    setBusy(true);
    const res = await createProject({ title, description, buildingId: buildingId || null });
    setBusy(false);
    if (res.ok) {
      toast.success("Proyecto creado.");
      setTitle("");
      setDescription("");
      setBuildingId("");
      setOpen(false);
      router.push(`/app/proyectos/${res.projectId}`);
    } else {
      toast.error(res.error);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo proyecto
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Nuevo proyecto</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 text-muted">
          <X className="size-5" />
        </button>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Título</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} placeholder="Ej. Pintura de áreas comunes" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Descripción (opcional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${input} min-h-20`} placeholder="Alcance del proyecto, qué se va a hacer…" />
      </label>
      {buildings.length > 1 && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Edificio</span>
          <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={input}>
            <option value="">Todo el PH</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />} Crear proyecto
      </button>
    </form>
  );
}
