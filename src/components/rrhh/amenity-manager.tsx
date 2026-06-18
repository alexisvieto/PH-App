"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { addAmenity, removeAmenity } from "@/app/app/propietarios/actions";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export type AmenityRow = {
  id: string;
  type: "estacionamiento" | "deposito";
  location: string | null;
  identifier: string | null;
};

function AmenityGroup({
  icon,
  title,
  rows,
  onRemove,
}: {
  icon: React.ReactNode;
  title: string;
  rows: AmenityRow[];
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        {icon} {title} <span className="text-muted">({rows.length})</span>
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted">Ninguno.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
              <span>
                {a.location ?? "—"}
                {a.identifier ? ` · ${a.identifier}` : ""}
              </span>
              <button onClick={() => onRemove(a.id)} className="text-muted hover:text-red-600" title="Quitar">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AmenityManager({
  unitId,
  amenities,
}: {
  unitId: string;
  amenities: AmenityRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const busyRef = useRef(false);

  const parking = amenities.filter((a) => a.type === "estacionamiento");
  const storage = amenities.filter((a) => a.type === "deposito");

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    const f = new FormData(e.currentTarget);
    const res = await addAmenity(unitId, {
      type: String(f.get("type") ?? "estacionamiento"),
      location: String(f.get("location") ?? ""),
      identifier: String(f.get("identifier") ?? ""),
    });
    busyRef.current = false;
    if (res.ok) {
      toast.success("Agregado.");
      setOpen(false);
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  async function onRemove(id: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    const res = await removeAmenity(id);
    busyRef.current = false;
    if (res.ok) {
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Estacionamientos y depósitos</h2>
        {!open && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-gray-50">
            <Plus className="size-4" /> Agregar
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AmenityGroup icon={<Car className="size-4 text-brand" />} title="Estacionamientos" rows={parking} onRemove={onRemove} />
        <AmenityGroup icon={<Package className="size-4 text-brand" />} title="Depósitos" rows={storage} onRemove={onRemove} />
      </div>

      {open && (
        <form onSubmit={onAdd} className="mt-4 grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Tipo</span>
            <select name="type" defaultValue="estacionamiento" className={input}>
              <option value="estacionamiento">Estacionamiento</option>
              <option value="deposito">Depósito</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Ubicación</span>
            <input name="location" className={input} placeholder="Ej. E2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Identificador</span>
            <input name="identifier" className={input} placeholder="Ej. 15 (opcional)" />
          </label>
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">Guardar</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
