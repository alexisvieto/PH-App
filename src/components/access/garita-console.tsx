"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, DoorOpen, Loader2, LogOut, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { lookupPass, registerVisit, type PassLookup } from "@/app/app/accesos/actions";
import { PASS_TYPE_LABEL } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
type Found = Extract<PassLookup, { ok: true }>;
type UnitOption = { id: string; label: string };

export function GaritaConsole({
  orgId,
  buildings,
  units,
}: {
  orgId: string;
  buildings: UnitOption[];
  units: UnitOption[];
}) {
  const singleBuilding = buildings.length === 1 ? buildings[0].id : null;
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [walkOpen, setWalkOpen] = useState(false);

  async function uploadPhoto(): Promise<string | null> {
    if (!photo) return null;
    const ext = EXT[photo.type];
    if (!ext) {
      toast.error("Formato de foto no permitido.");
      return null;
    }
    const path = `${orgId}/accesos/${crypto.randomUUID()}.${ext}`;
    const up = await createClient().storage.from("ph-photos").upload(path, photo, { contentType: photo.type });
    if (up.error) {
      toast.error("No se pudo subir la foto.");
      return null;
    }
    return path;
  }

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setLookupErr(null);
    setFound(null);
    const res = await lookupPass(code);
    busyRef.current = false;
    setBusy(false);
    if (res.ok) setFound(res);
    else setLookupErr(res.error);
  }

  /** Si el registro falla tras subir la foto, borra la foto huérfana del bucket. */
  async function cleanupPhoto(path: string | null) {
    if (path) await createClient().storage.from("ph-photos").remove([path]);
  }

  async function register(direction: "entrada" | "salida", passId?: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const photoPath = await uploadPhoto();
    const res = await registerVisit({
      passId: passId ?? null,
      visitorName: found?.pass.visitor_name ?? "",
      direction,
      photoPath,
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success(direction === "entrada" ? "Entrada registrada." : "Salida registrada.");
      setFound(null);
      setCode("");
      setPhoto(null);
      router.refresh();
    } else {
      await cleanupPhoto(photoPath);
      toast.error(res.error ?? "Error");
    }
  }

  async function onWalkIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const photoPath = await uploadPhoto();
    const res = await registerVisit({
      passId: null,
      visitorName: String(f.get("visitor_name") ?? ""),
      visitorDoc: String(f.get("visitor_doc") ?? ""),
      vehiclePlate: String(f.get("vehicle_plate") ?? ""),
      unitId: String(f.get("unit_id") ?? "") || null,
      buildingId: String(f.get("building_id") ?? "") || singleBuilding,
      direction: String(f.get("direction") ?? "entrada"),
      photoPath,
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Registro guardado.");
      setWalkOpen(false);
      setPhoto(null);
      router.refresh();
    } else {
      await cleanupPhoto(photoPath);
      toast.error(res.error ?? "Error");
    }
  }

  const PhotoInput = (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-brand transition hover:bg-gray-50">
      <Camera className="size-4" /> {photo ? "Foto lista ✓" : "Tomar foto"}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
      />
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Validar pase por código */}
      <form onSubmit={onLookup} className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-semibold">Validar pase</h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código del pase (QR)"
            className={`${input} font-mono tracking-widest`}
            autoFocus
          />
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Buscar
          </button>
        </div>
        {lookupErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{lookupErr}</p>}

        {found && (
          <div className="mt-4 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{found.pass.visitor_name}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${found.canEnter ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {found.canEnter ? "Puede ingresar" : found.reason}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {PASS_TYPE_LABEL[found.pass.type]} · Unidad {found.unitCode ?? "—"} · Vence {formatDate(found.pass.valid_to)}
              {found.pass.vehicle_plate ? ` · Placa ${found.pass.vehicle_plate}` : ""}
              {found.pass.max_uses !== null ? ` · Usos ${found.pass.uses_count}/${found.pass.max_uses}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {PhotoInput}
              <button
                onClick={() => register("entrada", found.pass.id)}
                disabled={busy || !found.canEnter}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                <DoorOpen className="size-4" /> Registrar entrada
              </button>
              <button
                onClick={() => register("salida", found.pass.id)}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-gray-50 disabled:opacity-60"
              >
                <LogOut className="size-4" /> Registrar salida
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Visita sin pase */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Visita sin pase</h2>
          {!walkOpen && (
            <button onClick={() => setWalkOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-gray-50">
              <UserPlus className="size-4" /> Registrar
            </button>
          )}
        </div>
        {walkOpen && (
          <form onSubmit={onWalkIn} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Visitante</span>
                <input name="visitor_name" required className={input} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Documento</span>
                <input name="visitor_doc" className={input} placeholder="Opcional" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Unidad que visita</span>
                <select name="unit_id" defaultValue="" className={input}>
                  <option value="">Sin unidad (común)</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </label>
              {buildings.length > 1 && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">Edificio (si es área común)</span>
                  <select name="building_id" defaultValue="" className={input}>
                    <option value="">Selecciona…</option>
                    {buildings.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Placa</span>
                <input name="vehicle_plate" className={input} placeholder="Opcional" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Dirección</span>
                <select name="direction" defaultValue="entrada" className={input}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PhotoInput}
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
                {busy && <Loader2 className="size-4 animate-spin" />} Guardar
              </button>
              <button type="button" onClick={() => setWalkOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
