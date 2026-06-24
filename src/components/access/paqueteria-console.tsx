"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Clock, Loader2, Package, PackageCheck, X } from "lucide-react";
import { toast } from "sonner";

import { deliverPackage, registerPackage } from "@/app/app/paqueteria/actions";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type UnitOption = { id: string; label: string };
type Pending = {
  id: string;
  unitCode: string;
  courier: string | null;
  notes: string | null;
  received_at: string;
  has_photo: boolean;
};

function dateTime(ts: string) {
  return new Date(ts).toLocaleString("es-PA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Panama",
  });
}

export function PaqueteriaConsole({
  orgId,
  units,
  pending,
}: {
  orgId: string;
  units: UnitOption[];
  pending: Pending[];
}) {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  async function uploadPhoto(): Promise<string | null | false> {
    if (!photo) return null;
    const ext = EXT[photo.type];
    if (!ext) {
      toast.error("Formato de foto no permitido.");
      return false;
    }
    const path = `${orgId}/paquetes/${crypto.randomUUID()}.${ext}`;
    const up = await createClient().storage.from("ph-photos").upload(path, photo, { contentType: photo.type });
    if (up.error) {
      toast.error("No se pudo subir la foto.");
      return false;
    }
    return path;
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    if (!unitId) {
      toast.error("Selecciona la unidad.");
      return;
    }
    // Captura el form antes del await: React anula e.currentTarget tras el evento.
    const form = e.currentTarget;
    busyRef.current = true;
    setBusy(true);
    const f = new FormData(form);
    const photoPath = await uploadPhoto();
    if (photoPath === false) {
      busyRef.current = false;
      setBusy(false);
      return;
    }
    const res = await registerPackage({
      unitId,
      courier: String(f.get("courier") ?? ""),
      notes: String(f.get("notes") ?? ""),
      photoPath,
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Aviso enviado al propietario.");
      setUnitId("");
      setPhoto(null);
      form.reset();
      router.refresh();
    } else {
      if (photoPath) await createClient().storage.from("ph-photos").remove([photoPath]);
      toast.error(res.error ?? "Error");
    }
  }

  async function onDeliver(packageId: string, deliveredTo: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await deliverPackage(packageId, deliveredTo);
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Paquete entregado.");
      setDeliveringId(null);
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <div className="space-y-5">
      {/* Registrar paquete */}
      <form onSubmit={onRegister} className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Package className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Registrar paquete</h2>
            <p className="text-xs text-muted">Avisa al propietario que tiene un paquete en garita</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Unidad destino</span>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={input} required>
              <option value="">Selecciona la unidad…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Mensajería</span>
              <input name="courier" className={input} placeholder="Opcional (Amazon, Uber…)" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Nota</span>
              <input name="notes" className={input} placeholder="Opcional (caja grande…)" />
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-brand transition hover:bg-gray-50 sm:w-auto">
              <Camera className="size-4" /> {photo ? "Foto lista ✓" : "Foto (opcional)"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:flex-1"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Package className="size-5" />} Avisar al
              propietario
            </button>
          </div>
        </div>
      </form>

      {/* En garita (pendientes) */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Clock className="size-4 text-amber-600" /> En garita
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {pending.length}
          </span>
        </h2>

        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
            No hay paquetes esperando.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">Unidad {p.unitCode}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {dateTime(p.received_at)}
                      {p.courier ? ` · ${p.courier}` : ""}
                      {p.has_photo ? " · 📷" : ""}
                    </p>
                    {p.notes && <p className="mt-1 text-sm text-ink/80">{p.notes}</p>}
                  </div>
                  {deliveringId !== p.id && (
                    <button
                      type="button"
                      onClick={() => setDeliveringId(p.id)}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <PackageCheck className="size-4" /> Entregar
                    </button>
                  )}
                </div>

                {deliveringId === p.id && (
                  <DeliverRow busy={busy} onCancel={() => setDeliveringId(null)} onConfirm={(name) => onDeliver(p.id, name)} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DeliverRow({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="mt-3 border-t border-line pt-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Entregado a (opcional)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
          placeholder="Nombre de quien retira"
          autoFocus
        />
      </label>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(name)}
          disabled={busy}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />} Confirmar entrega
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-3 text-muted transition hover:bg-gray-50"
          aria-label="Cancelar"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
